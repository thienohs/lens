/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { onApplicationIsReadyInjectionToken } from "../on-application-is-ready-injection-token";
import { initTray } from "../../../tray/tray";
import windowManagerInjectable from "../../../window-manager.injectable";
import stopServicesAndExitAppInjectable from "../../../stop-services-and-exit-app.injectable";
import trayMenuItemsInjectable from "../../../tray/tray-menu-items.injectable";
import navigateToPreferencesInjectable from "../../../../common/front-end-routing/routes/preferences/navigate-to-preferences.injectable";
import {
  onApplicationQuitInjectionToken,
} from "../../on-application-close/implementations/quit-application/on-application-quit/on-application-quit-injection-token";

const setupTrayInjectable = getInjectable({
  id: "setup-tray",

  instantiate: (di) => {
    const windowManager = di.inject(windowManagerInjectable);
    const trayMenuItems = di.inject(trayMenuItemsInjectable);
    const navigateToPreferences = di.inject(navigateToPreferencesInjectable);
    const stopServicesAndExitApp = di.inject(stopServicesAndExitAppInjectable);

    return {
      run: () => {
        const dispose = initTray(windowManager, trayMenuItems, navigateToPreferences, stopServicesAndExitApp);

        const disposeInjectable = getInjectable({
          id: "dispose-tray",

          instantiate: () => ({
            run: () => {
              dispose();
            },
          }),

          injectionToken: onApplicationQuitInjectionToken,
        });

        // TODO: Register once?
        di.register(disposeInjectable);
      },
    };
  },

  injectionToken: onApplicationIsReadyInjectionToken,
});

export default setupTrayInjectable;
