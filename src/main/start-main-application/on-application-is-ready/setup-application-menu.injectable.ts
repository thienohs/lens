/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { onApplicationIsReadyInjectionToken } from "../start-main-application.injectable";
import { buildMenu } from "../../menu/menu";
import applicationMenuItemsInjectable from "../../menu/application-menu-items.injectable";
import { autorun } from "mobx";

const setupApplicationMenuInjectable = getInjectable({
  id: "setup-application-menu",

  instantiate: (di) => {
    const applicationMenuItems = di.inject(applicationMenuItemsInjectable);

    return {
      run: () => {

        // TODO: Dispose on application quit
        autorun(() => buildMenu(applicationMenuItems.get()), {
          delay: 100,
        });
      },
    };
  },

  injectionToken: onApplicationIsReadyInjectionToken,
});

export default setupApplicationMenuInjectable;
