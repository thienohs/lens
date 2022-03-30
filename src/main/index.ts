/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Main process

import * as Mobx from "mobx";
import * as LensExtensionsCommonApi from "../extensions/common-api";
import * as LensExtensionsMainApi from "../extensions/main-api";
import { app, autoUpdater, dialog } from "electron";
import { isIntegrationTesting, isMac } from "../common/vars";
import logger from "./logger";
import { appEventBus } from "../common/app-event-bus/event-bus";
import type { InstalledExtension } from "../extensions/extension-discovery/extension-discovery";
import type { LensExtensionId } from "../extensions/lens-extension";
import { installDeveloperTools } from "./developer-tools";
import { ipcMainOn } from "../common/ipc";
import { startUpdateChecking } from "./app-updater";
import { IpcRendererNavigationEvents } from "../renderer/navigation/events";
import { startCatalogSyncToRenderer } from "./catalog-pusher";
import { catalogEntityRegistry } from "./catalog";
import { ensureDir } from "fs-extra";
import { initMenu } from "./menu/menu";
import { initTray } from "./tray/tray";
import { ShellSession } from "./shell-session/shell-session";
import { getDi } from "./getDi";
import extensionLoaderInjectable from "../extensions/extension-loader/extension-loader.injectable";
import extensionDiscoveryInjectable from "../extensions/extension-discovery/extension-discovery.injectable";
import directoryForKubeConfigsInjectable from "../common/app-paths/directory-for-kube-configs/directory-for-kube-configs.injectable";
import kubeconfigSyncManagerInjectable from "./catalog-sources/kubeconfig-sync-manager/kubeconfig-sync-manager.injectable";
import trayMenuItemsInjectable from "./tray/tray-menu-items.injectable";
import windowManagerInjectable from "./window-manager.injectable";
import navigateToPreferencesInjectable from "../common/front-end-routing/routes/preferences/navigate-to-preferences.injectable";
import startMainApplicationInjectable from "./start-main-application/start-main-application.injectable";
import stopServicesAndExitAppInjectable from "./stop-services-and-exit-app.injectable";
import applicationMenuItemsInjectable from "./menu/application-menu-items.injectable";

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

  const extensionLoader = di.inject(extensionLoaderInjectable);

  extensionLoader.init();

  const extensionDiscovery = di.inject(extensionDiscoveryInjectable);

  extensionDiscovery.init();

  // Start the app without showing the main window when auto starting on login
  // (On Windows and Linux, we get a flag. On MacOS, we get special API.)
  const startHidden = process.argv.includes("--hidden") || (isMac && app.getLoginItemSettings().wasOpenedAsHidden);

  logger.info("🖥️  Starting WindowManager");
  const windowManager = di.inject(windowManagerInjectable);

  const applicationMenuItems = di.inject(applicationMenuItemsInjectable);
  const trayMenuItems = di.inject(trayMenuItemsInjectable);
  const navigateToPreferences = di.inject(navigateToPreferencesInjectable);
  const stopServicesAndExitApp = di.inject(stopServicesAndExitAppInjectable);

  onQuitCleanup.push(
    initMenu(applicationMenuItems),
    initTray(windowManager, trayMenuItems, navigateToPreferences, stopServicesAndExitApp),
    () => ShellSession.cleanup(),
  );

  installDeveloperTools();

  if (!startHidden) {
    windowManager.ensureMainWindow();
  }

  ipcMainOn(IpcRendererNavigationEvents.LOADED, async () => {
    onCloseCleanup.push(startCatalogSyncToRenderer(catalogEntityRegistry));

    const directoryForKubeConfigs = di.inject(directoryForKubeConfigsInjectable);

    await ensureDir(directoryForKubeConfigs);

    const kubeConfigSyncManager = di.inject(kubeconfigSyncManagerInjectable);

    kubeConfigSyncManager.startSync();

    startUpdateChecking();
    lensProtocolRouterMain.rendererLoaded = true;
  });

  logger.info("🧩 Initializing extensions");

  // call after windowManager to see splash earlier
  try {
    const extensions = await extensionDiscovery.load();

    // Start watching after bundled extensions are loaded
    extensionDiscovery.watchExtensions();

    // Subscribe to extensions that are copied or deleted to/from the extensions folder
    extensionDiscovery.events
      .on("add", (extension: InstalledExtension) => {
        extensionLoader.addExtension(extension);
      })
      .on("remove", (lensExtensionId: LensExtensionId) => {
        extensionLoader.removeExtension(lensExtensionId);
      });

    extensionLoader.initExtensions(extensions);
  } catch (error) {
    dialog.showErrorBox("Lens Error", `Could not load extensions${error?.message ? `: ${error.message}` : ""}`);
    console.error(error);
    console.trace();
  }

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
