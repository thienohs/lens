/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import { KubernetesCluster, WebLink } from "../../../common/catalog-entities";
import type { CatalogEntityDetailsProps, CatalogEntityDetailRegistration } from "./catalog-entity-detail-registration";
import { DrawerItem, DrawerTitle } from "../drawer";
import React from "react";
import type { CatalogEntity } from "../../../common/catalog";

const coreDetailItemRegistrationsInjectable = getInjectable({
  instantiate: () => coreRegistrations,
  lifecycle: lifecycleEnum.singleton,
});

const coreRegistrations: CatalogEntityDetailRegistration<CatalogEntity>[] = [
  {
    apiVersions: [KubernetesCluster.apiVersion],
    kind: KubernetesCluster.kind,
    components: {
      Details: ({ entity }: CatalogEntityDetailsProps<KubernetesCluster>) => (
        <>
          <DrawerTitle title="Kubernetes Information" />
          <div className="box grow EntityMetadata">
            <DrawerItem name="Distribution">
              {entity.metadata.distro || "unknown"}
            </DrawerItem>
            <DrawerItem name="Kubelet Version">
              {entity.metadata.kubeVersion || "unknown"}
            </DrawerItem>
          </div>
        </>
      ),
    },
  },
  {
    apiVersions: [WebLink.apiVersion],
    kind: WebLink.kind,
    components: {
      Details: ({ entity }: CatalogEntityDetailsProps<WebLink>) => (
        <>
          <DrawerTitle title="More Information" />
          <DrawerItem name="URL">
            {entity.spec.url}
          </DrawerItem>
        </>
      ),
    },
  },
];


export default coreDetailItemRegistrationsInjectable;
