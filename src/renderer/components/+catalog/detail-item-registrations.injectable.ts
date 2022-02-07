/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable, lifecycleEnum } from "@ogre-tools/injectable";
import { computed } from "mobx";
import rendererExtensionsInjectable from "../../../extensions/renderer-extensions.injectable";
import coreDetailItemRegistrationsInjectable from "./core-detail-item-registrations.injectable";
import { orderByPriority } from "../../utils/order-by-priority";

const detailItemRegistrationsInjectable = getInjectable({
  instantiate: (di) => {
    const extensions = di.inject(rendererExtensionsInjectable);
    const coreRegistrations = di.inject(coreDetailItemRegistrationsInjectable);

    return computed(() => {
      const extensionRegistrations = extensions
        .get()
        .flatMap((extension) => extension.catalogEntityDetailItems);

      return orderByPriority([...coreRegistrations, ...extensionRegistrations]);
    });
  },

  lifecycle: lifecycleEnum.singleton,
});

export default detailItemRegistrationsInjectable;
