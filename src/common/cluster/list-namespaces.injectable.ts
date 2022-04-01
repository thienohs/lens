/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { CoreV1Api, KubeConfig } from "@kubernetes/client-node";
import { getInjectable } from "@ogre-tools/injectable";

export type ListNamespaces = () => Promise<string[]>;

function createListNamespaces(config: KubeConfig): ListNamespaces {
  const coreApi = config.makeApiClient(CoreV1Api);

  return async () => {
    const { body: { items }} = await coreApi.listNamespace();

    return items.map(ns => ns.metadata.name);
  };
}

const createListNamespacesInjectable = getInjectable({
  id: "list-namespaces",
  instantiate: () => createListNamespaces,
});

export default createListNamespacesInjectable;
