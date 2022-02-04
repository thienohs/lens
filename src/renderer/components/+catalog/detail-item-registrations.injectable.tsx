/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import { computed } from "mobx";
import rendererExtensionsInjectable from "../../../extensions/renderer-extensions.injectable";
import { KubernetesCluster, WebLink } from "../../../common/catalog-entities";
import { DrawerItem, DrawerTitle } from "../drawer";
import React from "react";
import type { CatalogEntity } from "../../../common/catalog";
import { orderBy } from "lodash/fp";
import type { CatalogEntityDetailRegistration, CatalogEntityDetailsProps } from "./catalog-entity-detail-registration";

const detailItemRegistrationsInjectable = getInjectable({
  instantiate: (di) => {
    const extensions = di.inject(rendererExtensionsInjectable);

    return computed(() => {
      const extensionRegistrations = extensions
        .get()
        .flatMap((extension) => extension.catalogEntityDetailItems);

      return orderByPriority([...coreRegistrations, ...extensionRegistrations]);
    });
  },

  lifecycle: lifecycleEnum.singleton,
});

export default detailItemRegistrationsInjectable;

const coreRegistrations = [
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

const orderByPriority = (
  registrations: CatalogEntityDetailRegistration<CatalogEntity>[],
) =>
  orderBy(
    "priority",
    "desc",
    registrations.map(({ priority = 50, ...rest }) => ({ priority, ...rest })),
  );
