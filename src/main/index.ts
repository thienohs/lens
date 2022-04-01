/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Main process

import * as Mobx from "mobx";
import * as LensExtensionsCommonApi from "../extensions/common-api";
import * as LensExtensionsMainApi from "../extensions/main-api";
import { app, autoUpdater } from "electron";
import { isIntegrationTesting } from "../common/vars";
import logger from "./logger";
import { appEventBus } from "../common/app-event-bus/event-bus";
import { getDi } from "./getDi";
import startMainApplicationInjectable from "./start-main-application/start-main-application.injectable";

const di = getDi();

const startApplication = di.inject(startMainApplicationInjectable);

startApplication()
  .then(() => {
    console.info("Application is running");
  })
  .catch((error) => {
    console.error(error);
  });

app.on("ready", async () => {
  /**
   * This variable should is used so that `autoUpdater.installAndQuit()` works
   */
  let blockQuit = !isIntegrationTesting;

  autoUpdater.on("before-quit-for-update", () => {
    logger.debug("Unblocking quit for update");
    blockQuit = false;
  });

  app.on("will-quit", (event) => {
    if (blockQuit) {
      // Quit app on Cmd+Q (MacOS)

      event.preventDefault(); // prevent app's default shutdown (e.g. required for telemetry, etc.)

      return; // skip exit to make tray work, to quit go to app's global menu or tray's menu
    }

    // onQuitCleanup();
  });

  // logger.debug("[APP-MAIN] waiting for 'ready' and other messages");

  // const directoryForExes = di.inject(directoryForExesInjectable);
  //
  // logger.info(`🚀 Starting ${productName} from "${directoryForExes}"`);

  /**
   * The following sync MUST be done before HotbarStore creation, because that
   * store has migrations that will remove items that previous migrations add
   * if this is not present
   */
  // syncGeneralCatalogEntities();

  setTimeout(() => {
    appEventBus.emit({ name: "service", action: "start" });
  }, 1000);
});

/**
 * Exports for virtual package "@k8slens/extensions" for main-process.
 * All exporting names available in global runtime scope:
 * e.g. global.Mobx, global.LensExtensions
 */
const LensExtensions = {
  Common: LensExtensionsCommonApi,
  Main: LensExtensionsMainApi,
};

export { Mobx, LensExtensions };
