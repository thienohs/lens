/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import styles from "./sidebar-cluster.module.scss";
import { observable } from "mobx";
import React, { useState } from "react";
import { broadcastMessage } from "../../../common/ipc";
import type { CatalogEntity, CatalogEntityContextMenu, CatalogEntityContextMenuContext } from "../../api/catalog-entity";
import { IpcRendererNavigationEvents } from "../../navigation/events";
import { Avatar } from "../avatar";
import { Icon } from "../icon";
import { navigate } from "../../navigation";
import { Menu, MenuItem } from "../menu";
import { ConfirmDialog } from "../confirm-dialog";
import { Tooltip } from "../tooltip";
import { withInjectables } from "@ogre-tools/injectable-react";
import hotbarStoreInjectable from "../../../common/hotbar-store.injectable";
import type { HotbarStore } from "../../../common/hotbar-store";
import { observer } from "mobx-react";
import { getIconColourHash } from "../../../common/catalog/helpers";
import { EntityIcon } from "../entity-icon";

const contextMenu: CatalogEntityContextMenuContext = observable({
  menuItems: [],
  navigate: (url: string, forceMainFrame = true) => {
    if (forceMainFrame) {
      broadcastMessage(IpcRendererNavigationEvents.NAVIGATE_IN_APP, url);
    } else {
      navigate(url);
    }
  },
});

function onMenuItemClick(menuItem: CatalogEntityContextMenu) {
  if (menuItem.confirm) {
    ConfirmDialog.open({
      okButtonProps: {
        primary: false,
        accent: true,
      },
      ok: () => {
        menuItem.onClick();
      },
      message: menuItem.confirm.message,
    });
  } else {
    menuItem.onClick();
  }
}

function renderLoadingSidebarCluster() {
  return (
    <div className={styles.SidebarCluster}>
      <Avatar
        background="var(--halfGray)"
        size={40}
        className={styles.loadingAvatar}
      >
        ??
      </Avatar>
      <div className={styles.loadingClusterName} />
    </div>
  );
}

interface Dependencies {
  hotbarStore: HotbarStore;
}

interface SidebarClusterProps {
  entity: CatalogEntity;
}

const NonInjectedSidebarCluster = observer(({ entity, hotbarStore }: Dependencies & SidebarClusterProps) => {
  const [opened, setOpened] = useState(false);

  if (!entity) {
    return renderLoadingSidebarCluster();
  }

  const onMenuOpen = () => {
    const isAddedToActive = hotbarStore.isAddedToActive(entity);
    const title = isAddedToActive
      ? "Remove from Hotbar"
      : "Add to Hotbar";
    const onClick = isAddedToActive
      ? () => hotbarStore.removeFromHotbar(entity.getId())
      : () => hotbarStore.addToHotbar(entity);

    contextMenu.menuItems = [{ title, onClick }];
    entity.onContextMenuOpen(contextMenu);

    toggle();
  };

  const onKeyDown = (evt: React.KeyboardEvent<HTMLDivElement>) => {
    if (evt.code == "Space") {
      toggle();
    }
  };

  const toggle = () => {
    setOpened(!opened);
  };

  const id = `cluster-${entity.getId()}`;
  const tooltipId = `tooltip-${id}`;

  return (
    <div
      id={id}
      className={styles.SidebarCluster}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="menubar"
      data-testid="sidebar-cluster-dropdown"
    >
      <Avatar
        colorHash={getIconColourHash(entity)}
        size={40}
        className={styles.avatar}
      >
        <EntityIcon entity={entity} />
      </Avatar>
      <div className={styles.clusterName} id={tooltipId}>
        {entity.getName()}
      </div>
      <Tooltip targetId={tooltipId}>
        {entity.getName()}
      </Tooltip>
      <Icon material="arrow_drop_down" className={styles.dropdown}/>
      <Menu
        usePortal
        htmlFor={id}
        isOpen={opened}
        open={onMenuOpen}
        closeOnClickItem
        closeOnClickOutside
        close={toggle}
        className={styles.menu}
      >
        {
          contextMenu.menuItems.map((menuItem) => (
            <MenuItem key={menuItem.title} onClick={() => onMenuItemClick(menuItem)}>
              {menuItem.title}
            </MenuItem>
          ))
        }
      </Menu>
    </div>
  );
});

export const SidebarCluster = withInjectables<Dependencies, SidebarClusterProps>(
  NonInjectedSidebarCluster,

  {
    getProps: (di, props) => ({
      hotbarStore: di.inject(hotbarStoreInjectable),
      ...props,
    }),
  },
);
