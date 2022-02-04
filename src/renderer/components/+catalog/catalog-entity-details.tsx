/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import styles from "./catalog-entity-details.module.scss";
import React, { Component } from "react";
import { observer } from "mobx-react";
import { Drawer, DrawerItem } from "../drawer";
import type { CatalogCategory, CatalogEntity } from "../../../common/catalog";
import { Icon } from "../icon";
import { CatalogEntityDrawerMenu } from "./catalog-entity-drawer-menu";
import { isDevelopment } from "../../../common/vars";
import { cssNames } from "../../utils";
import { Avatar } from "../avatar";
import { getLabelBadges } from "./helpers";
import detailsForCatalogEntityInjectable from "./details-for-catalog-entity.injectable";
import { withInjectables } from "@ogre-tools/injectable-react";
import type { CatalogEntityDetailsProps } from "./catalog-entity-detail-registration";

interface Props<T extends CatalogEntity> {
  entity: T;
  hideDetails(): void;
  onRun: () => void;
}

interface Dependencies<TEntity extends CatalogEntity> {
  details: { defaultIsShown: boolean, components: React.ComponentType<CatalogEntityDetailsProps<TEntity>>[] }
}

@observer
class NonInjectedCatalogEntityDetails<T extends CatalogEntity> extends Component<Dependencies<T> & Props<T>> {
  categoryIcon(category: CatalogCategory) {
    if (Icon.isSvg(category.metadata.icon)) {
      return <Icon svg={category.metadata.icon} smallest />;
    } else {
      return <Icon material={category.metadata.icon} smallest />;
    }
  }

  renderContent(entity: T) {
    const { onRun, hideDetails } = this.props;

    return (
      <>
        {this.props.details.defaultIsShown && (
          <div className="flex">
            <div className={styles.entityIcon}>
              <Avatar
                title={entity.getName()}
                colorHash={`${entity.getName()}-${entity.getSource()}`}
                size={128}
                src={entity.spec.icon?.src}
                data-testid="detail-panel-hot-bar-icon"
                background={entity.spec.icon?.background}
                onClick={onRun}
                className={styles.avatar}
              >
                {entity.spec.icon?.material && <Icon material={entity.spec.icon?.material}/>}
              </Avatar>
              {entity.isEnabled() && (
                <div className={styles.hint}>
                  Click to open
                </div>
              )}
            </div>
            <div className={cssNames("box grow", styles.metadata)}>
              <DrawerItem name="Name">
                {entity.getName()}
              </DrawerItem>
              <DrawerItem name="Kind">
                {entity.kind}
              </DrawerItem>
              <DrawerItem name="Source">
                {entity.getSource()}
              </DrawerItem>
              <DrawerItem name="Status">
                {entity.status.phase}
              </DrawerItem>
              <DrawerItem name="Labels">
                {getLabelBadges(entity, hideDetails)}
              </DrawerItem>
              {isDevelopment && (
                <DrawerItem name="Id">
                  {entity.getId()}
                </DrawerItem>
              )}
            </div>
          </div>
        )}
        <div className="box grow">
          {this.props.details.components.map((Details, index) => (
            <Details entity={entity} key={index} />
          ))}
        </div>
      </>
    );
  }

  render() {
    const { entity, hideDetails } = this.props;

    return (
      <Drawer
        className={styles.entityDetails}
        usePortal={true}
        open={true}
        title={`${entity.kind}: ${entity.getName()}`}
        toolbar={<CatalogEntityDrawerMenu entity={entity} key={entity.getId()} />}
        onClose={hideDetails}
      >
        {this.renderContent(entity)}
      </Drawer>
    );
  }
}

const InjectedCatalogEntityDetails = withInjectables<Dependencies<CatalogEntity>, Props<CatalogEntity>>(
  NonInjectedCatalogEntityDetails,

  {
    getProps: (di, props) => ({
      details: di.inject(detailsForCatalogEntityInjectable, props.entity),
      ...props,
    }),
  },
);

export const CatalogEntityDetails = <T extends CatalogEntity>(
  props: Props<T>,
) => <InjectedCatalogEntityDetails {...props} />;
