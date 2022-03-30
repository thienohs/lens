/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { onApplicationIsReadyInjectionToken } from "../start-main-application.injectable";
import generalCatalogEntitiesInjectable from "../../../common/catalog-entities/general-catalog-entities/general-catalog-entities.injectable";
import catalogEntityRegistryInjectable from "../../catalog/catalog-entity-registry.injectable";

const setupSyncingOfGeneralCatalogEntitiesInjectable = getInjectable({
  id: "setup-syncing-of-general-catalog-entities",

  instantiate: (di) => {
    const generalCatalogEntities = di.inject(generalCatalogEntitiesInjectable);
    const catalogEntityRegistry = di.inject(catalogEntityRegistryInjectable);

    return {
      run: () => {
        catalogEntityRegistry.addObservableSource(
          "lens:general",
          generalCatalogEntities,
        );
      },
    };
  },

  injectionToken: onApplicationIsReadyInjectionToken,
});

export default setupSyncingOfGeneralCatalogEntitiesInjectable;
