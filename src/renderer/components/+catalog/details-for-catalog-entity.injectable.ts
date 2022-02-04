/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import type { CatalogEntity } from "../../../common/catalog";
import detailItemRegistrationsInjectable from "./detail-item-registrations.injectable";
import { conforms, eq, includes } from "lodash/fp";

const detailsForCatalogEntityInjectable = getInjectable({
  instantiate: (di, catalogEntity: CatalogEntity) => {
    const allRegistrations = di.inject(detailItemRegistrationsInjectable);

    const registrationsForEntity = allRegistrations.get().filter(
      conforms({
        kind: eq(catalogEntity.kind),
        apiVersions: includes(catalogEntity.apiVersion),
      }),
    );

    return {
      defaultIsShown: !registrationsForEntity.some(
        (registration) => registration.priority > 999,
      ),

      components: registrationsForEntity.map(
        (registration) => registration.components.Details,
      ),
    };
  },

  lifecycle: lifecycleEnum.transient,
});

export default detailsForCatalogEntityInjectable;
