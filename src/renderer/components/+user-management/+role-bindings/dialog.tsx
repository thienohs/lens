/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import "./dialog.scss";

import { computed, observable, makeObservable, action } from "mobx";
import { observer } from "mobx-react";
import React from "react";

import { rolesStore } from "../+roles/store";
import { serviceAccountsStore } from "../+service-accounts/store";
import { NamespaceSelect } from "../../+namespaces/namespace-select";
import { ClusterRole, Role, roleApi, RoleBinding, ServiceAccount } from "../../../../common/k8s-api/endpoints";
import { Dialog, DialogProps } from "../../dialog";
import { EditableList } from "../../editable-list";
import { Icon } from "../../icon";
import { showDetails } from "../../kube-detail-params";
import { SubTitle } from "../../layout/sub-title";
import { Notifications } from "../../notifications";
import { Select, SelectOption } from "../../select";
import { Wizard, WizardStep } from "../../wizard";
import { roleBindingStore } from "./store";
import { clusterRolesStore } from "../+cluster-roles/store";
import { Input } from "../../input";
import { ObservableHashSet, nFircate } from "../../../utils";
import type { Subject } from "../../../../common/k8s-api/endpoints/types/subject";

export interface RoleBindingDialogProps extends Partial<DialogProps> {
}

interface DialogState {
  isOpen: boolean;
  data?: RoleBinding;
}

@observer
export class RoleBindingDialog extends React.Component<RoleBindingDialogProps> {
  static state = observable.object<DialogState>({
    isOpen: false,
  });

  constructor(props: RoleBindingDialogProps) {
    super(props);
    makeObservable(this);
  }

  static open(roleBinding?: RoleBinding) {
    RoleBindingDialog.state.isOpen = true;
    RoleBindingDialog.state.data = roleBinding;
  }

  static close() {
    RoleBindingDialog.state.isOpen = false;
    RoleBindingDialog.state.data = undefined;
  }

  get roleBinding() {
    return RoleBindingDialog.state.data;
  }

  @computed get isEditing() {
    return !!this.roleBinding;
  }

  @observable.ref selectedRoleRef: Role | ClusterRole | null | undefined = null;
  @observable bindingName = "";
  @observable bindingNamespace: string | null = null;
  selectedAccounts = new ObservableHashSet<ServiceAccount>([], sa => sa.metadata.uid);
  selectedUsers = observable.set<string>([]);
  selectedGroups = observable.set<string>([]);

  @computed get selectedBindings(): Subject[] {
    const serviceAccounts: Subject[] = Array.from(this.selectedAccounts, sa => ({
      name: sa.getName(),
      kind: "ServiceAccount",
      namespace: sa.getNs(),
    }));
    const users: Subject[] = Array.from(this.selectedUsers, user => ({
      name: user,
      kind: "User",
    }));
    const groups: Subject[] = Array.from(this.selectedGroups, group => ({
      name: group,
      kind: "Group",
    }));

    return [
      ...serviceAccounts,
      ...users,
      ...groups,
    ];
  }

  @computed get roleRefOptions(): (Role | ClusterRole)[] {
    const roles = rolesStore.items
      .filter(role => role.getNs() === this.bindingNamespace);
    const clusterRoles = clusterRolesStore.items;

    return [
      ...roles,
      ...clusterRoles,
    ];
  }

  @computed get serviceAccountOptions(): SelectOption<ServiceAccount>[] {
    return serviceAccountsStore.items.map(account => ({
      value: account,
      label: `${account.getName()} (${account.getNs()})`,
    }));
  }

  @computed get selectedServiceAccountOptions(): SelectOption<ServiceAccount>[] {
    return this.serviceAccountOptions.filter(({ value }) => this.selectedAccounts.has(value));
  }

  onOpen = action(() => {
    const binding = this.roleBinding;

    if (!binding) {
      return this.reset();
    }

    const findByRoleRefName = (item: Role | ClusterRole) => item.getName() === binding.roleRef.name;

    this.selectedRoleRef = (
      binding.roleRef.kind === roleApi.kind
        ? rolesStore.items.find(findByRoleRefName)
        : clusterRolesStore.items.find(findByRoleRefName)
    );

    this.bindingName = binding.getName();
    this.bindingNamespace = binding.getNs();

    const [saSubjects, uSubjects, gSubjects] = nFircate(binding.getSubjects(), "kind", ["ServiceAccount", "User", "Group"]);
    const accountNames = new Set(saSubjects.map(acc => acc.name));

    this.selectedAccounts.replace(
      serviceAccountsStore.items
        .filter(sa => accountNames.has(sa.getName())),
    );
    this.selectedUsers.replace(uSubjects.map(user => user.name));
    this.selectedGroups.replace(gSubjects.map(group => group.name));
  });

  reset = action(() => {
    this.selectedRoleRef = null;
    this.bindingName = "";
    this.bindingNamespace = "";
    this.selectedAccounts.clear();
    this.selectedUsers.clear();
    this.selectedGroups.clear();
  });

  createBindings = async () => {
    const { selectedRoleRef, bindingNamespace, selectedBindings, roleBinding, bindingName } = this;

    if (!selectedRoleRef || !roleBinding || !bindingNamespace || !bindingName) {
      return;
    }

    try {
      const newRoleBinding = this.isEditing
        ? await roleBindingStore.updateSubjects(roleBinding, selectedBindings)
        : await roleBindingStore.create({
          name: bindingName,
          namespace: bindingNamespace,
        }, {
          subjects: selectedBindings,
          roleRef: {
            name: selectedRoleRef.getName(),
            kind: selectedRoleRef.kind,
          },
        });

      showDetails(newRoleBinding.selfLink);
      RoleBindingDialog.close();
    } catch (err) {
      Notifications.checkedError(err, `Unknown error occured while ${this.isEditing ? "editing" : "creating"} role bindings.`);
    }
  };

  renderContents() {
    return (
      <>
        <SubTitle title="Namespace" />
        <NamespaceSelect
          id="dialog-namespace-input"
          themeName="light"
          isDisabled={this.isEditing}
          value={this.bindingNamespace}
          autoFocus={!this.isEditing}
          onChange={namespace => this.bindingNamespace = namespace}
        />

        <SubTitle title="Role Reference" />
        <Select
          id="role-reference-input"
          themeName="light"
          placeholder="Select role or cluster role ..."
          isDisabled={this.isEditing}
          options={this.roleRefOptions}
          value={this.selectedRoleRef}
          getOptionLabel={ref => ref.getName()}
          onChange={roleRef => {
            this.selectedRoleRef = roleRef;

            if (!this.selectedRoleRef || this.bindingName === this.selectedRoleRef.getName()) {
              this.bindingName = roleRef?.getName() ?? "";
            }
          }}
        />

        <SubTitle title="Binding Name" />
        <Input
          disabled={this.isEditing}
          value={this.bindingName}
          onChange={value => this.bindingName = value}
        />

        <SubTitle title="Binding targets" />

        <b>Users</b>
        <EditableList
          placeholder="Bind to User Account ..."
          add={(newUser) => this.selectedUsers.add(newUser)}
          items={Array.from(this.selectedUsers)}
          remove={({ oldItem }) => this.selectedUsers.delete(oldItem)}
        />

        <b>Groups</b>
        <EditableList
          placeholder="Bind to User Group ..."
          add={(newGroup) => this.selectedGroups.add(newGroup)}
          items={Array.from(this.selectedGroups)}
          remove={({ oldItem }) => this.selectedGroups.delete(oldItem)}
        />

        <b>Service Accounts</b>
        <Select
          id="service-account-input"
          isMulti
          themeName="light"
          placeholder="Select service accounts ..."
          options={this.serviceAccountOptions}
          value={this.selectedServiceAccountOptions}
          formatOptionLabel={({ value }: SelectOption<ServiceAccount>) => (
            <><Icon small material="account_box" /> {value.getName()} ({value.getNs()})</>
          )}
          onChange={selected => {
            this.selectedAccounts.replace(selected.map(opt => opt.value));
          }}
          maxMenuHeight={200}
        />
      </>
    );
  }

  render() {
    const { ...dialogProps } = this.props;
    const [action, nextLabel] = this.isEditing ? ["Edit", "Update"] : ["Add", "Create"];
    const disableNext = !this.selectedRoleRef || !this.selectedBindings.length || !this.bindingNamespace || !this.bindingName;

    return (
      <Dialog
        {...dialogProps}
        className="AddRoleBindingDialog"
        isOpen={RoleBindingDialog.state.isOpen}
        close={RoleBindingDialog.close}
        onClose={this.reset}
        onOpen={this.onOpen}
      >
        <Wizard
          header={<h5>{action} RoleBinding</h5>}
          done={RoleBindingDialog.close}
        >
          <WizardStep
            nextLabel={nextLabel}
            next={this.createBindings}
            disabledNext={disableNext}
          >
            {this.renderContents()}
          </WizardStep>
        </Wizard>
      </Dialog>
    );
  }
}
