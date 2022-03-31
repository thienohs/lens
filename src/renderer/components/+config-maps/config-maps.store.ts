/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { KubeObjectStore } from "../../../common/k8s-api/kube-object.store";
import { ConfigMap, ConfigMapApi, configMapApi, ConfigMapData } from "../../../common/k8s-api/endpoints/configmap.api";
import { apiManager } from "../../../common/k8s-api/api-manager";
import { isClusterPageContext } from "../../utils";

export class ConfigMapStore extends KubeObjectStore<ConfigMap, ConfigMapApi, ConfigMapData> {
}

export const configMapStore = isClusterPageContext()
  ? new ConfigMapStore(configMapApi)
  : undefined as never;

if (isClusterPageContext()) {
  apiManager.registerStore(configMapStore);
}
