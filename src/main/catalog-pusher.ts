/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { computed, reaction } from "mobx";
import { broadcastMessage, ipcMainOn } from "../common/ipc";
import type { CatalogEntityRegistry } from "./catalog";
import "../common/catalog-entities/kubernetes-cluster";
import { disposer, toJS } from "../common/utils";
import { debounce } from "lodash";
import type { CatalogEntity, CatalogEntityData, CatalogEntityKindData } from "../common/catalog";
import { EntityPreferencesStore } from "../common/entity-preferences-store";
import { catalogInitChannel, catalogItemsChannel } from "../common/ipc/catalog";

function changesDueToPreferences({ metadata, spec, status, kind, apiVersion }: CatalogEntity): CatalogEntityData & CatalogEntityKindData {
  const preferences = EntityPreferencesStore.getInstance().preferences.get(metadata.uid) ?? {};

  if (preferences.shortName) {
    metadata.shortName ||= preferences.shortName;
  }

  return { metadata, spec, status, kind, apiVersion };
}

const broadcaster = debounce((items: (CatalogEntityData & CatalogEntityKindData)[]) => {
  broadcastMessage(catalogItemsChannel, items);
}, 100, { leading: true, trailing: true });

export function pushCatalogToRenderer(catalog: CatalogEntityRegistry) {
  const entityData = computed(() => toJS(catalog.items.map(changesDueToPreferences)));

  return disposer(
    ipcMainOn(catalogInitChannel, () => broadcaster(toJS(catalog.items))),
    reaction(() => toJS(entityData.get()), broadcaster, {
      fireImmediately: true,
    }),
  );
}
