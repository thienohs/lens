/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { action, observable, reaction, when, makeObservable } from "mobx";
import { KubeObjectStore } from "../../../../common/k8s-api/kube-object.store";
import { Cluster, ClusterApi, getMetricsByNodeNames, type ClusterMetricData } from "../../../../common/k8s-api/endpoints";
import { autoBind, StorageHelper } from "../../../utils";
import { type IMetricsReqParams, normalizeMetrics } from "../../../../common/k8s-api/endpoints/metrics.api";
import { nodesStore } from "../../+nodes/nodes.store";

export enum MetricType {
  MEMORY = "memory",
  CPU = "cpu",
}

export enum MetricNodeRole {
  MASTER = "master",
  WORKER = "worker",
}

export interface ClusterOverviewStorageState {
  metricType: MetricType;
  metricNodeRole: MetricNodeRole;
}

interface Dependencies {
  storage: StorageHelper<ClusterOverviewStorageState>;
}

export class ClusterOverviewStore extends KubeObjectStore<Cluster, ClusterApi> implements ClusterOverviewStorageState {
  @observable metrics: Partial<ClusterMetricData> = {};
  @observable metricsLoaded = false;

  get metricType(): MetricType {
    return this.dependencies.storage.get().metricType;
  }

  set metricType(value: MetricType) {
    this.dependencies.storage.merge({ metricType: value });
  }

  get metricNodeRole(): MetricNodeRole {
    return this.dependencies.storage.get().metricNodeRole;
  }

  set metricNodeRole(value: MetricNodeRole) {
    this.dependencies.storage.merge({ metricNodeRole: value });
  }

  constructor(protected readonly dependencies: Dependencies, api: ClusterApi) {
    super(api);
    makeObservable(this);
    autoBind(this);

    this.init();
  }

  private init() {
    // TODO: refactor, seems not a correct place to be
    // auto-refresh metrics on user-action
    reaction(() => this.metricNodeRole, () => {
      if (!this.metricsLoaded) return;
      this.resetMetrics();
      this.loadMetrics();
    });

    // check which node type to select
    reaction(() => nodesStore.items.length, () => {
      const { masterNodes, workerNodes } = nodesStore;

      if (!masterNodes.length) this.metricNodeRole = MetricNodeRole.WORKER;
      if (!workerNodes.length) this.metricNodeRole = MetricNodeRole.MASTER;
    });
  }

  @action
  async loadMetrics(params?: IMetricsReqParams) {
    await when(() => nodesStore.isLoaded);
    const { masterNodes, workerNodes } = nodesStore;
    const nodes = this.metricNodeRole === MetricNodeRole.MASTER && masterNodes.length ? masterNodes : workerNodes;

    this.metrics = await getMetricsByNodeNames(nodes.map(node => node.getName()), params);
    this.metricsLoaded = true;
  }

  getMetricsValues(source: Partial<ClusterMetricData>): [number, string][] {
    switch (this.metricType) {
      case MetricType.CPU:
        return normalizeMetrics(source.cpuUsage).data.result[0].values;
      case MetricType.MEMORY:
        return normalizeMetrics(source.memoryUsage).data.result[0].values;
      default:
        return [];
    }
  }

  @action
  resetMetrics() {
    this.metrics = {};
    this.metricsLoaded = false;
  }

  reset() {
    super.reset();
    this.resetMetrics();
    this.dependencies.storage?.reset();
  }
}
