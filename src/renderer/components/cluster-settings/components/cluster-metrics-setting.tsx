/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import { disposeOnUnmount, observer } from "mobx-react";
import { Select } from "../../select/select";
import { Icon } from "../../icon/icon";
import { Button } from "../../button/button";
import { SubTitle } from "../../layout/sub-title";
import type { Cluster } from "../../../../common/cluster/cluster";
import { observable, reaction, makeObservable } from "mobx";
import { ClusterMetricsResourceType } from "../../../../common/cluster-types";

export interface ClusterMetricsSettingProps {
  cluster: Cluster;
}

@observer
export class ClusterMetricsSetting extends React.Component<ClusterMetricsSettingProps> {
  @observable hiddenMetrics = observable.set<string>();

  constructor(props: ClusterMetricsSettingProps) {
    super(props);
    makeObservable(this);
  }

  componentDidMount() {
    this.hiddenMetrics = observable.set<string>(this.props.cluster.preferences.hiddenMetrics ?? []);

    disposeOnUnmount(this, [
      reaction(() => this.props.cluster.preferences.hiddenMetrics, () => {
        this.hiddenMetrics = observable.set<string>(this.props.cluster.preferences.hiddenMetrics ?? []);
      }),
    ]);
  }

  save = () => {
    this.props.cluster.preferences.hiddenMetrics = Array.from(this.hiddenMetrics);
  };

  onChangeSelect = (values: readonly ClusterMetricsResourceType[]) => {
    for (const value of values) {
      if (this.hiddenMetrics.has(value)) {
        this.hiddenMetrics.delete(value);
      } else {
        this.hiddenMetrics.add(value);
      }
    }
    this.save();
  };

  onChangeButton = () => {
    Object.keys(ClusterMetricsResourceType).map(value =>
      this.hiddenMetrics.add(value),
    );
    this.save();
  };

  reset = () => {
    this.hiddenMetrics.clear();
    this.save();
  };

  formatOptionLabel = (resource: ClusterMetricsResourceType) => (
    <div className="flex gaps align-center">
      <span>{resource}</span>
      {this.hiddenMetrics.has(resource) && <Icon smallest
        material="check"
        className="box right" />}
    </div>
  );

  renderMetricsSelect() {

    return (
      <>
        <Select
          id="cluster-metric-resource-type-input"
          className="box grow"
          placeholder="Select metrics to hide..."
          isMulti
          isSearchable
          onMenuClose={this.save}
          closeMenuOnSelect={false}
          controlShouldRenderValue={false}
          options={Object.values(ClusterMetricsResourceType)}
          onChange={this.onChangeSelect}
          formatOptionLabel={this.formatOptionLabel}
          themeName="lens"
        />
        <Button
          primary
          label="Hide all metrics"
          onClick={this.onChangeButton}
        />
        <Button
          primary
          label="Reset"
          onClick={this.reset}
        />
      </>
    );
  }

  render() {

    return (
      <div className="MetricsSelec0 mb-5">
        <SubTitle title={"Hide metrics from the UI"}/>
        <div className="flex gaps">
          {this.renderMetricsSelect()}
        </div>
      </div>
    );
  }
}
