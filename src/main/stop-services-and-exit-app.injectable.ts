/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import exitAppInjectable from "./app-paths/get-electron-app-path/electron-app/exit-app.injectable";
import clusterManagerInjectable from "./cluster-manager.injectable";
import { appEventBus } from "../common/app-event-bus/event-bus";
import logger from "./logger";
import windowManagerInjectable from "./window-manager.injectable";

const stopServicesAndExitAppInjectable = getInjectable({
  id: "stop-services-and-exit-app",

  instantiate: (di) => {
    const exitApp = di.inject(exitAppInjectable);
    const windowManager = di.inject(windowManagerInjectable);
    const clusterManager = di.inject(clusterManagerInjectable);

    return () => {
      appEventBus.emit({ name: "service", action: "close" });
      windowManager.hide();
      clusterManager.stop();
      logger.info("SERVICE:QUIT");
      setTimeout(exitApp, 1000);
    };
  },

  causesSideEffects: true,
});

export default stopServicesAndExitAppInjectable;
