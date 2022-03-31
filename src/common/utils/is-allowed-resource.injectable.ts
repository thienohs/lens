/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import { computed } from "mobx";
import allowedResourcesInjectable from "../cluster-store/allowed-resources.injectable";
import type { KubeResource } from "../rbac";

export type IsAllowedResource = (resource: KubeResource) => boolean;

const isAllowedResourceInjectable = getInjectable({
  id: "is-allowed-resource",

  instantiate: (di, resourceName: string) => {
    const allowedResources = di.inject(allowedResourcesInjectable);

    return computed(() => allowedResources.get().has(resourceName));
  },

  lifecycle: lifecycleEnum.keyedSingleton({
    getInstanceKey: (di, resource: string) => resource,
  }),
});

export default isAllowedResourceInjectable;
