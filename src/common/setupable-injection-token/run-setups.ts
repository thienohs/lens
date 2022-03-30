/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import type { DiContainer } from "@ogre-tools/injectable";

import {
  onApplicationIsReadyInjectionToken, beforeApplicationIsReadyInjectionToken,
} from "../../main/start-main-application/start-main-application.injectable";

export const runSetups = async (di: DiContainer) => {
  await Promise.all(
    di
      .injectMany(beforeApplicationIsReadyInjectionToken)
      .map((setupable) => setupable.run()),
  );

  await Promise.all(
    di
      .injectMany(onApplicationIsReadyInjectionToken)
      .map((setupable) => setupable.run()),
  );
};
