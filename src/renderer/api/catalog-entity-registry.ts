/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { computed, observable, makeObservable, action } from "mobx";
import { ipcRendererOn } from "../../common/ipc";
import { CatalogCategory, CatalogEntity, CatalogEntityData, catalogCategoryRegistry, CatalogCategoryRegistry, CatalogEntityKindData } from "../../common/catalog";
import "../../common/catalog-entities";
import type { Cluster } from "../../common/cluster/cluster";
import { ClusterStore } from "../../common/cluster-store/cluster-store";
import { iter } from "../utils";
import type { Disposer } from "../utils";
import { once } from "lodash";
import logger from "../../common/logger";
import { CatalogRunEvent } from "../../common/catalog/catalog-run-event";
import { ipcRenderer } from "electron";
import { catalogInitChannel, catalogItemsChannel, catalogEntityRunListener } from "../../common/ipc/catalog";
import { navigate } from "../navigation";
import { isMainFrame } from "process";

export type EntityFilter = (entity: CatalogEntity) => any;
export type CatalogEntityOnBeforeRun = (event: CatalogRunEvent) => void | Promise<void>;

export const catalogEntityRunContext = {
  navigate: (url: string) => navigate(url),
  setCommandPaletteContext: (entity?: CatalogEntity) => {
    catalogEntityRegistry.activeEntity = entity;
  },
};

export class CatalogEntityRegistry {
  @observable protected activeEntityId: string | undefined = undefined;
  protected _entities = observable.map<string, CatalogEntity>([], { deep: true });
  protected filters = observable.set<EntityFilter>([], {
    deep: false,
  });
  protected onBeforeRunHooks = observable.set<CatalogEntityOnBeforeRun>([], {
    deep: false,
  });

  /**
   * Buffer for keeping entities that don't yet have CatalogCategory synced
   */
  protected rawEntities: (CatalogEntityData & CatalogEntityKindData)[] = [];

  constructor(private categoryRegistry: CatalogCategoryRegistry) {
    makeObservable(this);
  }

  protected getActiveEntityById() {
    return this._entities.get(this.activeEntityId) || null;
  }

  get activeEntity(): CatalogEntity | null {
    const entity = this.getActiveEntityById();

    // If the entity was not found but there are rawEntities to be processed,
    // try to process them and return the entity.
    // This might happen if an extension registered a new Catalog category.
    if (this.activeEntityId && !entity && this.rawEntities.length > 0) {
      this.processRawEntities();

      return this.getActiveEntityById();
    }

    return entity;
  }

  set activeEntity(raw: CatalogEntity | string | null) {
    if (raw) {
      const id = typeof raw === "string"
        ? raw
        : raw.getId();

      this.activeEntityId = id;
    } else {
      this.activeEntityId = undefined;
    }
  }

  init() {
    ipcRendererOn(catalogItemsChannel, (event, items: (CatalogEntityData & CatalogEntityKindData)[]) => {
      console.log(items);
      this.updateItems(items);
    });

    // Make sure that we get items ASAP and not the next time one of them changes
    ipcRenderer.send(catalogInitChannel);

    if (isMainFrame) {
      ipcRendererOn(catalogEntityRunListener, (event, id: string) => {
        const entity = this.getById(id);

        if (entity) {
          this.onRun(entity);
        }
      });
    }
  }

  @action updateItems(items: (CatalogEntityData & CatalogEntityKindData)[]) {
    this.rawEntities.length = 0;

    const newIds = new Set(items.map((item) => item.metadata.uid));

    for (const uid of this._entities.keys()) {
      if (!newIds.has(uid)) {
        this._entities.delete(uid);
      }
    }

    for (const item of items) {
      this.updateItem(item);
    }
  }

  @action protected updateItem(item: (CatalogEntityData & CatalogEntityKindData)) {
    const existing = this._entities.get(item.metadata.uid);

    if (!existing) {
      const entity = this.categoryRegistry.getEntityForData(item);

      if (entity) {
        this._entities.set(entity.getId(), entity);
      } else {
        this.rawEntities.push(item);
      }
    } else {
      existing.metadata = item.metadata;
      existing.spec = item.spec;
      existing.status = item.status;
    }
  }

  protected processRawEntities() {
    const items = [...this.rawEntities];

    this.rawEntities.length = 0;

    for (const item of items) {
      this.updateItem(item);
    }
  }

  @computed get items() {
    this.processRawEntities();

    return Array.from(this._entities.values());
  }

  @computed get filteredItems() {
    return Array.from(
      iter.reduce(
        this.filters,
        iter.filter,
        this.items.values(),
      ),
    );
  }

  @computed get entities(): Map<string, CatalogEntity> {
    return new Map(
      this.items.map(entity => [entity.getId(), entity]),
    );
  }

  @computed get filteredEntities(): Map<string, CatalogEntity> {
    return new Map(
      this.filteredItems.map(entity => [entity.getId(), entity]),
    );
  }

  getById<T extends CatalogEntity>(id: string) {
    return this.entities.get(id) as T;
  }

  getItemsForApiKind<T extends CatalogEntity>(apiVersion: string, kind: string, { filtered = false } = {}): T[] {
    const byApiKind = (item: CatalogEntity) => item.apiVersion === apiVersion && item.kind === kind;
    const entities = filtered ? this.filteredItems : this.items;

    return entities.filter(byApiKind) as T[];
  }

  getItemsForCategory<T extends CatalogEntity>(category: CatalogCategory, { filtered = false } = {}): T[] {
    const supportedVersions = new Set(category.spec.versions.map((v) => `${category.spec.group}/${v.name}`));
    const byApiVersionKind = (item: CatalogEntity) => supportedVersions.has(item.apiVersion) && item.kind === category.spec.names.kind;
    const entities = filtered ? this.filteredItems : this.items;

    return entities.filter(byApiVersionKind) as T[];
  }

  /**
   * Add a new filter to the set of item filters
   * @param fn The function that should return a truthy value if that entity should be sent currently "active"
   * @returns A function to remove that filter
   */
  @action addCatalogFilter(fn: EntityFilter): Disposer {
    this.filters.add(fn);

    return once(() => void this.filters.delete(fn));
  }

  /**
   * Add a onBeforeRun hook. If `onBeforeRun` was previously added then it will not be added again
   * @param onBeforeRun The function that should return a boolean if the onRun of catalog entity should be triggered.
   * @returns A function to remove that hook
   */
  @action addOnBeforeRun(onBeforeRun: CatalogEntityOnBeforeRun): Disposer {
    this.onBeforeRunHooks.add(onBeforeRun);

    return once(() => void this.onBeforeRunHooks.delete(onBeforeRun));
  }

  /**
   * Runs all the registered `onBeforeRun` hooks, short circuiting on the first event that's preventDefaulted
   * @param entity The entity to run the hooks on
   * @returns Whether the entities `onRun` method should be executed
   */
  async onBeforeRun(entity: CatalogEntity): Promise<boolean> {
    logger.debug(`[CATALOG-ENTITY-REGISTRY]: run onBeforeRun on ${entity.getId()}`);

    const runEvent = new CatalogRunEvent({ target: entity });

    for (const onBeforeRun of this.onBeforeRunHooks) {
      try {
        await onBeforeRun(runEvent);
      } catch (error) {
        logger.warn(`[CATALOG-ENTITY-REGISTRY]: entity ${entity.getId()} onBeforeRun threw an error`, error);
      }

      if (runEvent.defaultPrevented) {
        return false;
      }
    }

    return true;
  }

  /**
   * Perform the onBeforeRun check and, if successful, then proceed to call `entity`'s onRun method
   * @param entity The instance to invoke the hooks and then execute the onRun
   */
  onRun(entity: CatalogEntity): void {
    this.onBeforeRun(entity)
      .then(doOnRun => {
        if (doOnRun) {
          return entity.onRun?.(catalogEntityRunContext);
        } else {
          logger.debug(`onBeforeRun for ${entity.getId()} returned false`);
        }
      })
      .catch(error => logger.error(`[CATALOG-ENTITY-REGISTRY]: entity ${entity.getId()} onRun threw an error`, error));
  }
}

export const catalogEntityRegistry = new CatalogEntityRegistry(catalogCategoryRegistry);

export function getActiveClusterEntity(): Cluster | undefined {
  return ClusterStore.getInstance().getById(catalogEntityRegistry.activeEntity?.getId());
}
