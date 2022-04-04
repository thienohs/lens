/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import appEventBusInjectable from "../../../../common/app-event-bus/app-event-bus.injectable";
import { onApplicationQuitInjectionToken } from "../on-application-quit-injection-token";
import loggerInjectable from "../../../../common/logger.injectable";

const emitQuitToCommandBusInjectable = getInjectable({
  id: "emit-quit-to-command-bus",

  instantiate: (di) => {
    const appEventBus = di.inject(appEventBusInjectable);
    const logger = di.inject(loggerInjectable);

    return {
      run: () => {
        logger.debug("will-quit message");

        // This is called when the close button of the main window is clicked
        logger.info("APP:QUIT");

        appEventBus.emit({ name: "app", action: "close" });
      },
    };
  },

  injectionToken: onApplicationQuitInjectionToken,
});

export default emitQuitToCommandBusInjectable;
