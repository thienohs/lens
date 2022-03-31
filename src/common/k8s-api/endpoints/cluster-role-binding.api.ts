/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { isClusterPageContext } from "../../utils/cluster-id-url-parsing";
import { DerivedKubeApiOptions, KubeApi } from "../kube-api";
import type { KubeJsonApiData } from "../kube-json-api";
import { KubeObject, KubeObjectMetadata } from "../kube-object";
import type { RoleRef } from "./types/role-ref";
import type { Subject } from "./types/subject";

export interface ClusterRoleBindingData extends KubeJsonApiData<KubeObjectMetadata<"cluster-scoped">, void, void> {
  subjects?: Subject[];
  roleRef: RoleRef;
}

export class ClusterRoleBinding extends KubeObject<void, void, "cluster-scoped"> {
  static kind = "ClusterRoleBinding";
  static namespaced = false;
  static apiBase = "/apis/rbac.authorization.k8s.io/v1/clusterrolebindings";

  subjects?: Subject[];
  roleRef: RoleRef;

  constructor({
    subjects,
    roleRef,
    ...rest
  }: ClusterRoleBindingData) {
    super(rest);
    this.subjects = subjects;
    this.roleRef = roleRef;
  }

  getSubjects() {
    return this.subjects ?? [];
  }

  getSubjectNames(): string {
    return this.getSubjects().map(subject => subject.name).join(", ");
  }
}

export class ClusterRoleBindingApi extends KubeApi<ClusterRoleBinding, ClusterRoleBindingData> {
  constructor(opts: DerivedKubeApiOptions = {}) {
    super({
      ...opts,
      objectConstructor: ClusterRoleBinding,
    });
  }
}

export const clusterRoleBindingApi = isClusterPageContext()
  ? new ClusterRoleBindingApi()
  : undefined as never;
