/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import "./overview.scss";

import React from "react";
import { disposeOnUnmount, observer } from "mobx-react";
import { eventStore } from "../+events/event.store";
import { podsStore } from "../+workloads-pods/pods.store";
import { deploymentStore } from "../+workloads-deployments/deployments.store";
import { daemonSetStore } from "../+workloads-daemonsets/daemonsets.store";
import { statefulSetStore } from "../+workloads-statefulsets/statefulset.store";
import { replicaSetStore } from "../+workloads-replicasets/replicasets.store";
import { jobStore } from "../+workloads-jobs/job.store";
import { cronJobStore } from "../+workloads-cronjobs/cronjob.store";
import { IComputedValue, makeObservable, observable, reaction } from "mobx";
import { NamespaceSelectFilter } from "../+namespaces/namespace-select-filter";
import { Icon } from "../icon";
import { TooltipPosition } from "../tooltip";
import { withInjectables } from "@ogre-tools/injectable-react";
import clusterFrameContextInjectable from "../../cluster-frame-context/cluster-frame-context.injectable";
import type { ClusterFrameContext } from "../../cluster-frame-context/cluster-frame-context";
import kubeWatchApiInjectable from "../../kube-watch-api/kube-watch-api.injectable";
import type { SubscribeStores } from "../../kube-watch-api/kube-watch-api";
import detailComponentsInjectable from "./detail-components.injectable";
import { SiblingsInTabLayout } from "../layout/siblings-in-tab-layout";

interface Dependencies {
  detailComponents: IComputedValue<React.ComponentType<{}>[]>;
  clusterFrameContext: ClusterFrameContext;
  subscribeStores: SubscribeStores;
}

@observer
class NonInjectedWorkloadsOverview extends React.Component<Dependencies> {
  @observable loadErrors: string[] = [];

  constructor(props: Dependencies) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {
    disposeOnUnmount(this, [
      this.props.subscribeStores([
        cronJobStore,
        daemonSetStore,
        deploymentStore,
        eventStore,
        jobStore,
        podsStore,
        replicaSetStore,
        statefulSetStore,
      ], {
        onLoadFailure: error => this.loadErrors.push(String(error)),
      }),
      reaction(() => this.props.clusterFrameContext.contextNamespaces.slice(), () => {
        // clear load errors
        this.loadErrors.length = 0;
      }),
    ]);
  }

  renderLoadErrors() {
    if (this.loadErrors.length === 0) {
      return null;
    }

    return (
      <Icon
        material="warning"
        className="load-error"
        tooltip={{
          children: (
            <>
              {this.loadErrors.map((error, index) => <p key={index}>{error}</p>)}
            </>
          ),
          preferredPositions: TooltipPosition.BOTTOM,
        }}
      />
    );
  }

  render() {
    return (
      <SiblingsInTabLayout>
        <div className="WorkloadsOverview flex column gaps">
          <div className="header flex gaps align-center">
            <h5 className="box grow">Overview</h5>
            {this.renderLoadErrors()}
            <NamespaceSelectFilter id="overview-namespace-select-filter-input" />
          </div>

          {this.props.detailComponents.get().map((Details, index) => (
            <Details key={`workload-overview-${index}`} />
          ))}
        </div>
      </SiblingsInTabLayout>
    );
  }
}

export const WorkloadsOverview = withInjectables<Dependencies>(
  NonInjectedWorkloadsOverview,

  {
    getProps: (di) => ({
      detailComponents: di.inject(detailComponentsInjectable),
      clusterFrameContext: di.inject(clusterFrameContextInjectable),
      subscribeStores: di.inject(kubeWatchApiInjectable).subscribeStores,
    }),
  },
);
