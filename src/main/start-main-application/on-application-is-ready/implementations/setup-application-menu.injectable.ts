/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { onApplicationIsReadyInjectionToken } from "../on-application-is-ready-injection-token";
import { buildMenu } from "../../../menu/menu";
import applicationMenuItemsInjectable from "../../../menu/application-menu-items.injectable";
import { autorun } from "mobx";
import { onApplicationQuitInjectionToken } from "../../on-application-close/implementations/quit-application/on-application-quit/on-application-quit-injection-token";

const setupApplicationMenuInjectable = getInjectable({
  id: "setup-application-menu",

  instantiate: (di) => {
    const applicationMenuItems = di.inject(applicationMenuItemsInjectable);

    return {
      run: () => {
        const dispose = autorun(() => buildMenu(applicationMenuItems.get()), {
          delay: 100,
        });

        const disposeInjectable = getInjectable({
          id: "dispose-application-menu-items",

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

export default setupApplicationMenuInjectable;
