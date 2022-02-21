/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { computed } from "mobx";

import isActiveRouteInjectable from "../../routes/is-active-route.injectable";
import hasAccessToRouteInjectable from "../../routes/has-access-to-route.injectable";
import networkPoliciesRouteInjectable from "./network-policies-route.injectable";
import { getUrl } from "../../routes/get-url";
import {
  networkChildSidebarItemsInjectionToken,
} from "../+network/network-sidebar-items.injectable";

const networkPoliciesSidebarItemsInjectable = getInjectable({
  id: "network-policies-sidebar-items",

  instantiate: (di) => {
    const route = di.inject(networkPoliciesRouteInjectable);
    const isActiveRoute = di.inject(isActiveRouteInjectable);
    const hasAccessToRoute = di.inject(hasAccessToRouteInjectable);

    return computed(() => [
      {
        id: "network-policies",
        title: "Network Policies",
        url: getUrl(route),
        isActive: isActiveRoute(route),
        isVisible: hasAccessToRoute(route),
      },
    ]);
  },

  injectionToken: networkChildSidebarItemsInjectionToken,
});

export default networkPoliciesSidebarItemsInjectable;
