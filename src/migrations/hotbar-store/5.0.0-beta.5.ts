/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { Hotbar } from "../../common/hotbar-types";
import { catalogEntityRegistry } from "../../main/catalog";
import type { MigrationDeclaration } from "../helpers";

export default {
  version: "5.0.0-beta.5",
  run(store) {
    const rawHotbars = store.get("hotbars");
    const hotbars: Hotbar[] = Array.isArray(rawHotbars) ? rawHotbars : [];

    for (const hotbar of hotbars) {
      for (let i = 0; i < hotbar.items.length; i += 1) {
        const item = hotbar.items[i];

        if (!item) {
          continue;
        }

        const entity = catalogEntityRegistry.findById(item.entity.uid);

        if (!entity) {
          // Clear disabled item
          hotbar.items[i] = null;
        } else {
          // Save additional data
          item.entity = {
            ...item.entity,
            name: entity.metadata.name,
            source: entity.metadata.source,
          };
        }
      }
    }

    store.set("hotbars", hotbars);
  },
} as MigrationDeclaration;
