/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import styles from "./cluster-overview.module.scss";

import React from "react";
import { reaction } from "mobx";
import { disposeOnUnmount, observer } from "mobx-react";
import { nodesStore } from "../+nodes/nodes.store";
import { podsStore } from "../+workloads-pods/pods.store";
import { getHostedClusterId, interval } from "../../utils";
import { TabLayout } from "../layout/tab-layout";
import { Spinner } from "../spinner";
import { ClusterIssues } from "./cluster-issues";
import { ClusterMetrics } from "./cluster-metrics";
import type { ClusterOverviewStore } from "./cluster-overview-store/cluster-overview-store";
import { ClusterPieCharts } from "./cluster-pie-charts";
import { getActiveClusterEntity } from "../../api/catalog-entity-registry";
import { ClusterMetricsResourceType } from "../../../common/cluster-types";
import { ClusterStore } from "../../../common/cluster-store/cluster-store";
import { eventStore } from "../+events/event.store";
import { withInjectables } from "@ogre-tools/injectable-react";
import kubeWatchApiInjectable from "../../kube-watch-api/kube-watch-api.injectable";
import clusterOverviewStoreInjectable from "./cluster-overview-store/cluster-overview-store.injectable";
import type { SubscribeStores } from "../../kube-watch-api/kube-watch-api";

interface Dependencies {
  subscribeStores: SubscribeStores;
  clusterOverviewStore: ClusterOverviewStore;
}

@observer
class NonInjectedClusterOverview extends React.Component<Dependencies> {
  private metricPoller = interval(60, () => this.loadMetrics());

  loadMetrics() {
    const cluster = ClusterStore.getInstance().getById(getHostedClusterId());

    if (cluster?.available) {
      this.props.clusterOverviewStore.loadMetrics();
    }
  }

  componentDidMount() {
    this.metricPoller.start(true);

    disposeOnUnmount(this, [
      this.props.subscribeStores([
        podsStore,
        eventStore,
        nodesStore,
      ]),

      reaction(
        () => this.props.clusterOverviewStore.metricNodeRole, // Toggle Master/Worker node switcher
        () => this.metricPoller.restart(true),
      ),
    ]);
  }

  componentWillUnmount() {
    this.metricPoller.stop();
  }

  renderMetrics(isMetricsHidden?: boolean) {
    if (isMetricsHidden) {
      return null;
    }

    return (
      <>
        <ClusterMetrics/>
        <ClusterPieCharts/>
      </>
    );
  }

  renderClusterOverview(isLoaded: boolean, isMetricsHidden?: boolean) {
    if (!isLoaded) {
      return <Spinner center/>;
    }

    return (
      <>
        {this.renderMetrics(isMetricsHidden)}
        <ClusterIssues className={isMetricsHidden ? "OnlyClusterIssues" : ""}/>
      </>
    );
  }

  render() {
    const isLoaded = nodesStore.isLoaded && eventStore.isLoaded;
    const isMetricHidden = getActiveClusterEntity()?.isMetricHidden(ClusterMetricsResourceType.Cluster);

    return (
      <TabLayout>
        <div className={styles.ClusterOverview} data-testid="cluster-overview-page">
          {this.renderClusterOverview(isLoaded, isMetricHidden)}
        </div>
      </TabLayout>
    );
  }
}

export const ClusterOverview = withInjectables<Dependencies>(
  NonInjectedClusterOverview,

  {
    getProps: (di) => ({
      subscribeStores: di.inject(kubeWatchApiInjectable).subscribeStores,
      clusterOverviewStore: di.inject(clusterOverviewStoreInjectable),
    }),
  },
);
