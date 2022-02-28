/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { orderBy } from "lodash/fp";

interface ItemWithPriority {
  priority?: number;
}

export const orderByPriority = <T extends ItemWithPriority>(items: T[]) =>
  orderBy(
    "priority",
    "desc",
    items.map(({ priority = 50, ...rest }) => ({ priority, ...rest })),
  );

