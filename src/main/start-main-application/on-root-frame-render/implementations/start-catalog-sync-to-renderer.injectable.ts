/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { onRootFrameRenderInjectionToken } from "../on-root-frame-render-injection-token";
import { startCatalogSyncToRenderer } from "../../../catalog-pusher";
import catalogEntityRegistryInjectable from "../../../catalog/catalog-entity-registry.injectable";
import { onApplicationCloseInjectionToken } from "../../on-application-close/on-application-close-injection-token";

const startCatalogSyncToRendererInjectable = getInjectable({
  id: "start-catalog-sync-to-renderer",

  instantiate: (di) => {
    const catalogEntityRegistry = di.inject(catalogEntityRegistryInjectable);

    return {
      run: () => {
        const dispose = startCatalogSyncToRenderer(catalogEntityRegistry);


        const disposeInjectable = getInjectable({
          id: "dispose-catalog-sync",

          instantiate: () => ({
            run: () => {
              dispose();
            },
          }),

          injectionToken: onApplicationCloseInjectionToken,
        });

        // TODO: Register once?
        di.register(disposeInjectable);

      },
    };
  },

  injectionToken: onRootFrameRenderInjectionToken,
});

export default startCatalogSyncToRendererInjectable;
