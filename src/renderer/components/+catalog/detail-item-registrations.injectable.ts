/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import { computed } from "mobx";
import rendererExtensionsInjectable from "../../../extensions/renderer-extensions.injectable";
import type { CatalogEntity } from "../../../common/catalog";
import { orderBy } from "lodash/fp";
import type { CatalogEntityDetailRegistration } from "./catalog-entity-detail-registration";
import coreDetailItemRegistrationsInjectable from "./core-detail-item-registrations.injectable";

const detailItemRegistrationsInjectable = getInjectable({
  instantiate: (di) => {
    const extensions = di.inject(rendererExtensionsInjectable);
    const coreRegistrations = di.inject(coreDetailItemRegistrationsInjectable);

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

const orderByPriority = (
  registrations: CatalogEntityDetailRegistration<CatalogEntity>[],
) =>
  orderBy(
    "priority",
    "desc",
    registrations.map(({ priority = 50, ...rest }) => ({ priority, ...rest })),
  );
