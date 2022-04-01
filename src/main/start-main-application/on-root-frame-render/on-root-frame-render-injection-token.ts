/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectionToken } from "@ogre-tools/injectable";
import type { Runnable } from "../start-main-application.injectable";

export const onRootFrameRenderInjectionToken = getInjectionToken<Runnable>({
  id: "on-root-frame-render",
});
