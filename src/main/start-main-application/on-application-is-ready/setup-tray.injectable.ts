/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { onApplicationIsReadyInjectionToken } from "../start-main-application.injectable";
import { initTray } from "../../tray/tray";
import windowManagerInjectable from "../../window-manager.injectable";
import stopServicesAndExitAppInjectable from "../../stop-services-and-exit-app.injectable";
import trayMenuItemsInjectable from "../../tray/tray-menu-items.injectable";
import navigateToPreferencesInjectable from "../../../common/front-end-routing/routes/preferences/navigate-to-preferences.injectable";

const setupTrayInjectable = getInjectable({
  id: "setup-tray",

  instantiate: (di) => {
    const windowManager = di.inject(windowManagerInjectable);
    const trayMenuItems = di.inject(trayMenuItemsInjectable);
    const navigateToPreferences = di.inject(navigateToPreferencesInjectable);
    const stopServicesAndExitApp = di.inject(stopServicesAndExitAppInjectable);

    return {
      run: () => {

        // TODO: Dispose on application quit
        initTray(windowManager, trayMenuItems, navigateToPreferences, stopServicesAndExitApp);
      },
    };
  },

  injectionToken: onApplicationIsReadyInjectionToken,
});

export default setupTrayInjectable;
