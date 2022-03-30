/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { beforeApplicationIsReadyInjectionToken } from "../start-main-application.injectable";
import { powerMonitor } from "electron";
import exitAppInjectable from "../../app-paths/get-electron-app-path/electron-app/exit-app.injectable";

const setupShutdownOfApplicationWhenSystemShutdownsInjectable = getInjectable({
  id: "setup-shutdown-of-application-when-system-shutdowns",

  instantiate: (di) => {
    const exitApp = di.inject(exitAppInjectable);

    return {
      run: () => {
        powerMonitor.on("shutdown", exitApp);
      },
    };
  },

  causesSideEffects: true,

  injectionToken: beforeApplicationIsReadyInjectionToken,
});

export default setupShutdownOfApplicationWhenSystemShutdownsInjectable;
