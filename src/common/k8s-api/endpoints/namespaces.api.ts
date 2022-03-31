/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { KubeApi } from "../kube-api";
import { KubeObject, KubeObjectStatus } from "../kube-object";
import { metricsApi } from "./metrics.api";
import type { PodMetricData } from "./pods.api";
import { isClusterPageContext } from "../../utils/cluster-id-url-parsing";

export enum NamespaceStatusKind {
  ACTIVE = "Active",
  TERMINATING = "Terminating",
}

export interface NamespaceSpec {
  finalizers?: string[];
}

export interface NamespaceStatus extends KubeObjectStatus {
  phase?: string;
}

export class Namespace extends KubeObject<NamespaceStatus, NamespaceSpec, "cluster-scoped"> {
  static readonly kind = "Namespace";
  static readonly namespaced = false;
  static readonly apiBase = "/api/v1/namespaces";

  getStatus() {
    return this.status?.phase ?? "-";
  }
}

export class NamespaceApi extends KubeApi<Namespace> {
}

export function getMetricsForNamespace(namespace: string, selector = ""): Promise<PodMetricData> {
  const opts = { category: "pods", pods: ".*", namespace, selector };

  return metricsApi.getMetrics({
    cpuUsage: opts,
    memoryUsage: opts,
    fsUsage: opts,
    fsWrites: opts,
    fsReads: opts,
    networkReceive: opts,
    networkTransmit: opts,
  }, {
    namespace,
  });
}

let namespacesApi: NamespaceApi;

if (isClusterPageContext()) {
  namespacesApi = new NamespaceApi({
    objectConstructor: Namespace,
  });
}

export {
  namespacesApi,
};
