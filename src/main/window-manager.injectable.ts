/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { WindowManager } from "./window-manager";
import lensProxyInjectable from "./lens-proxy.injectable";

const windowManagerInjectable = getInjectable({
  id: "window-manager",

  instantiate: (di) =>
    new WindowManager({
      lensProxy: di.inject(lensProxyInjectable),
    }),

  causesSideEffects: true,
});

export default windowManagerInjectable;
