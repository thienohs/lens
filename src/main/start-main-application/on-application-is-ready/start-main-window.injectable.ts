/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { onApplicationIsReadyInjectionToken } from "../start-main-application.injectable";
import windowManagerInjectable from "../../window-manager.injectable";
import electronAppInjectable from "../../app-paths/get-electron-app-path/electron-app/electron-app.injectable";
import loggerInjectable from "../../../common/logger.injectable";
import isMacInjectable from "../../../common/vars/is-mac.injectable";

const startMainWindowInjectable = getInjectable({
  id: "start-main-window",

  instantiate: (di) => {
    const windowManager = di.inject(windowManagerInjectable);
    const app = di.inject(electronAppInjectable);
    const logger = di.inject(loggerInjectable);
    const isMac = di.inject(isMacInjectable);

    return {
      run: () => {
        // Start the app without showing the main window when auto starting on login
        // (On Windows and Linux, we get a flag. On MacOS, we get special API.)
        const startHidden =
          process.argv.includes("--hidden") ||
          (isMac && app.getLoginItemSettings().wasOpenedAsHidden);

        logger.info("🖥️  Starting WindowManager");

        if (!startHidden) {
          windowManager.ensureMainWindow();
        }
      },
    };
  },

  injectionToken: onApplicationIsReadyInjectionToken,
});

export default startMainWindowInjectable;
