/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import applicationMenuInitializerInjectable from "./application-menu-initializer.injectable";
import { onApplicationQuitInjectionToken } from "../start-main-application/on-application-close/implementations/quit-application/on-application-quit/on-application-quit-injection-token";

const cleanupApplicationMenuInjectable = getInjectable({
  id: "cleanup-application-menu",

  instantiate: (di) => {
    const initializeApplicationMenu = di.inject(
      applicationMenuInitializerInjectable,
    );

    return {
      run: () => {
        initializeApplicationMenu.stop();
      },
    };
  },

  injectionToken: onApplicationQuitInjectionToken,
});

export default cleanupApplicationMenuInjectable;
