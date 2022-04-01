/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import { autorun, computed, makeObservable, observable } from "mobx";
import { disposeOnUnmount, observer } from "mobx-react";
import type { DockTab, TabId } from "../dock/store";
import type { EditResourceTabStore } from "./store";
import { InfoPanel } from "../info-panel";
import { Badge } from "../../badge";
import { EditorPanel } from "../editor-panel";
import { Spinner } from "../../spinner";
import type { KubeObject } from "../../../../common/k8s-api/kube-object";
import { withInjectables } from "@ogre-tools/injectable-react";
import editResourceTabStoreInjectable from "./store.injectable";
import { noop } from "../../../utils";
import closeDockTabInjectable from "../dock/close-dock-tab.injectable";
import yaml from "js-yaml";

export interface EditResourceProps {
  tab: DockTab;
}

interface Dependencies {
  editResourceStore: EditResourceTabStore;
  closeTab: (tabId: TabId) => void;
}

@observer
class NonInjectedEditResource extends React.Component<EditResourceProps & Dependencies> {
  @observable error = "";

  constructor(props: EditResourceProps & Dependencies) {
    super(props);
    makeObservable(this);
  }

  componentDidMount(): void {
    disposeOnUnmount(this, [
      autorun(() => {
        const store = this.props.editResourceStore.getStore(this.props.tab.id);
        const tabData = this.props.editResourceStore.getData(this.props.tab.id);
        const obj = this.resource;

        if (!obj) {
          if (store?.isLoaded) {
            // auto-close tab when resource removed from store
            this.props.closeTab(this.props.tab.id);
          } else if (!store.isLoading) {
            // preload resource for editing
            store.loadFromPath(tabData.resource).catch(noop);
          }
        }
      }),
    ]);
  }

  get tabId() {
    return this.props.tab.id;
  }

  get isReadyForEditing() {
    return this.props.editResourceStore.isReady(this.tabId);
  }

  get resource(): KubeObject | undefined {
    return this.props.editResourceStore.getResource(this.tabId);
  }

  @computed get draft(): string {
    if (!this.isReadyForEditing) {
      return ""; // wait until tab's data and kube-object resource are loaded
    }

    const editData = this.props.editResourceStore.getData(this.tabId);

    if (typeof editData.draft === "string") {
      return editData.draft;
    }

    const firstDraft = yaml.dump(this.resource.toPlainObject()); // dump resource first time

    return editData.firstDraft = firstDraft;
  }

  saveDraft(draft: string) {
    this.props.editResourceStore.getData(this.tabId).draft = draft;
  }

  onChange = (draft: string) => {
    this.error = ""; // reset first
    this.saveDraft(draft);
  };

  onError = (error?: Error | string) => {
    this.error = error.toString();
  };

  save = async () => {
    if (this.error) {
      return null;
    }

    const { kind, name } = await this.props.editResourceStore.commitEdits(this.tabId);

    return <p>{kind} <b>{name}</b> updated.</p>;
  };

  render() {
    const { tabId, error, onChange, onError, save, draft, isReadyForEditing, resource } = this;

    if (!isReadyForEditing) {
      return <Spinner center/>;
    }

    return (
      <div className="EditResource flex column">
        <InfoPanel
          tabId={tabId}
          error={error}
          submit={save}
          submitLabel="Save"
          submittingMessage="Applying.."
          controls={(
            <div className="resource-info flex gaps align-center">
              <span>Kind:</span><Badge label={resource.kind}/>
              <span>Name:</span><Badge label={resource.getName()}/>
              <span>Namespace:</span><Badge label={resource.getNs() || "global"}/>
            </div>
          )}
        />
        <EditorPanel
          tabId={tabId}
          value={draft}
          onChange={onChange}
          onError={onError}
        />
      </div>
    );
  }
}

export const EditResource = withInjectables<Dependencies, EditResourceProps>(NonInjectedEditResource, {
  getProps: (di, props) => ({
    editResourceStore: di.inject(editResourceTabStoreInjectable),
    closeTab: di.inject(closeDockTabInjectable),
    ...props,
  }),
});
