/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import styles from "./sidebar.module.scss";

import React from "react";
import { observer } from "mobx-react";
import { cssNames } from "../../utils";
import { SidebarItem } from "./sidebar-item";
import { catalogEntityRegistry } from "../../api/catalog-entity-registry";
import { SidebarCluster } from "./sidebar-cluster";
import { withInjectables } from "@ogre-tools/injectable-react";
import sidebarItemsInjectable, { type HierarchicalSidebarItem } from "./sidebar-items.injectable";
import type { IComputedValue } from "mobx";

interface Dependencies {
  sidebarItems: IComputedValue<HierarchicalSidebarItem[]>;
}

const NonInjectedSidebar = observer(({ sidebarItems }: Dependencies) => (
  <div className={cssNames("flex flex-col")} data-testid="cluster-sidebar">
    <SidebarCluster entity={catalogEntityRegistry.activeEntity} />

    <div className={`${styles.sidebarNav} sidebar-active-status`}>
      {sidebarItems.get().map(item => (
        <SidebarItem
          item={item}
          key={item.registration.id}
        />
      ))}
    </div>
  </div>
));

export const Sidebar = withInjectables<Dependencies>(NonInjectedSidebar, {
  getProps: (di, props) => ({
    ...props,
    sidebarItems: di.inject(sidebarItemsInjectable),
  }),
});

Sidebar.displayName = "Sidebar";
