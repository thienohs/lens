/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { StorageHelper } from "../../../utils";
import { DockTabStorageState, DockTabStore } from "../dock-tab-store/dock-tab.store";
import type { TabId } from "../dock/store";
import type { KubeObject } from "../../../../common/k8s-api/kube-object";
import { apiManager } from "../../../../common/k8s-api/api-manager";
import type { KubeObjectStore } from "../../../../common/k8s-api/kube-object.store";

export interface EditingResource {
  resource: string; // resource path, e.g. /api/v1/namespaces/default
  draft?: string; // edited draft in yaml
  firstDraft?: string;
}

interface Dependencies {
  createStorage:<T> (storageKey: string, options: DockTabStorageState<T>) => StorageHelper<DockTabStorageState<T>>;
}

export class EditResourceTabStore extends DockTabStore<EditingResource> {
  constructor(protected dependencies: Dependencies) {
    super(dependencies, {
      storageKey: "edit_resource_store",
    });
  }

  protected finalizeDataForSave({ draft, ...data }: EditingResource): EditingResource {
    return data; // skip saving draft to local-storage
  }

  isReady(tabId: TabId) {
    return super.isReady(tabId) && Boolean(this.getResource(tabId)); // ready to edit resource
  }

  getStore(tabId: TabId): KubeObjectStore | undefined {
    const apiPath = this.getResourcePath(tabId);

    return apiPath
      ? apiManager.getStore(apiPath)
      : undefined;
  }

  getResource(tabId: TabId): KubeObject | undefined {
    const apiPath = this.getResourcePath(tabId);

    if (apiPath) {
      return apiManager.getStore(apiPath)?.getByPath(apiPath);
    }

    return undefined;
  }

  getResourcePath(tabId: TabId): string | undefined {
    return this.getData(tabId)?.resource;
  }

  getTabIdByResource(object: KubeObject): string | undefined {
    return this.findTabIdFromData(({ resource }) => object.selfLink === resource);
  }

  clearInitialDraft(tabId: TabId): void {
    delete this.getData(tabId)?.firstDraft;
  }
}
