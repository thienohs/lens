/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { KubeObject, KubeObjectMetadata } from "../kube-object";
import { DerivedKubeApiOptions, KubeApi } from "../kube-api";
import type { KubeJsonApiData } from "../kube-json-api";
import { isClusterPageContext } from "../../utils/cluster-id-url-parsing";
import type { RoleRef } from "./types/role-ref";
import type { Subject } from "./types/subject";

export interface RoleBindingData extends KubeJsonApiData<KubeObjectMetadata<"namespace-scoped">, void, void> {
  subjects?: Subject[];
  roleRef: RoleRef;
}

export class RoleBinding extends KubeObject<void, void, "namespace-scoped"> {
  static readonly kind = "RoleBinding";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/rbac.authorization.k8s.io/v1/rolebindings";

  subjects?: Subject[];
  roleRef: RoleRef;

  constructor({ subjects, roleRef, ...rest }: RoleBindingData) {
    super(rest);
    this.subjects = subjects;
    this.roleRef = roleRef;
  }

  getSubjects() {
    return this.subjects || [];
  }

  getSubjectNames(): string {
    return this.getSubjects().map(subject => subject.name).join(", ");
  }
}

export class RoleBindingApi extends KubeApi<RoleBinding, RoleBindingData> {
  constructor(opts: DerivedKubeApiOptions = {}) {
    super({
      ...opts,
      objectConstructor: RoleBinding,
    });
  }
}

export const roleBindingApi = isClusterPageContext()
  ? new RoleBindingApi()
  : undefined as never;
