/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { KubeObject, KubeObjectMetadata } from "../kube-object";
import { DerivedKubeApiOptions, KubeApi } from "../kube-api";
import { isClusterPageContext } from "../../utils/cluster-id-url-parsing";
import type { KubeJsonApiData } from "../kube-json-api";

export interface PodMetricsData extends KubeJsonApiData<KubeObjectMetadata<"namespace-scoped">, void, void> {
  timestamp: string;
  window: string;
  containers: PodMetricsContainer[];
}

export interface PodMetricsContainerUsage {
  cpu: string;
  memory: string;
}

export interface PodMetricsContainer {
  name: string;
  usage: PodMetricsContainerUsage;
}

export class PodMetrics extends KubeObject<void, void, "namespace-scoped"> {
  static readonly kind = "PodMetrics";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/metrics.k8s.io/v1beta1/pods";

  timestamp: string;
  window: string;
  containers: PodMetricsContainer[];

  constructor({
    timestamp,
    window,
    containers,
    ...rest
  }: PodMetricsData) {
    super(rest);
    this.timestamp = timestamp;
    this.window = window;
    this.containers = containers;
  }
}

export class PodMetricsApi extends KubeApi<PodMetrics, PodMetricsData> {
  constructor(opts: DerivedKubeApiOptions = {}) {
    super({
      ...opts,
      objectConstructor: PodMetrics,
    });
  }
}

export const podMetricsApi = isClusterPageContext()
  ? new PodMetricsApi()
  : undefined as never;
