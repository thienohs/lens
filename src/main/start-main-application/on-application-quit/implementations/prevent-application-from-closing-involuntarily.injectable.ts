/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import { onApplicationQuitInjectionToken } from "../on-application-quit-injection-token";
import { isIntegrationTesting } from "../../../../common/vars";

const preventApplicationFromClosingInvoluntarilyInjectable = getInjectable({
  id: "prevent-application-from-closing-involuntarily",

  instantiate: () => ({
    run: ({ event }) => {
      if (!isIntegrationTesting){ // &&!autoUpdateIsRunning) {
        event.preventDefault();
      }
    },
  }),

  causesSideEffects: true,

  injectionToken: onApplicationQuitInjectionToken,
});

export default preventApplicationFromClosingInvoluntarilyInjectable;
