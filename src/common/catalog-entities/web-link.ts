/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { CatalogCategory, CatalogEntity, CatalogEntityContextMenuContext, CatalogEntityMetadata, CatalogEntityStatus, categoryVersion } from "../catalog";
import { catalogCategoryRegistry } from "../catalog/catalog-category-registry";
import { productName } from "../vars";
import { WeblinkStore } from "../weblink-store";

export type WebLinkStatusPhase = "available" | "unavailable";

export interface WebLinkStatus extends CatalogEntityStatus {
  phase: WebLinkStatusPhase;
}

export interface WebLinkSpec {
  url: string;
}

export class WebLink extends CatalogEntity<CatalogEntityMetadata, WebLinkStatus, WebLinkSpec> {
  public static readonly apiVersion = "entity.k8slens.dev/v1alpha1";
  public static readonly kind = "WebLink";

  public readonly apiVersion = WebLink.apiVersion;
  public readonly kind = WebLink.kind;

  async onRun() {
    window.open(this.spec.url, "_blank");
  }

  public onSettingsOpen(): void {
    return;
  }

  async onContextMenuOpen(context: CatalogEntityContextMenuContext) {
    if (this.metadata.source === "local") {
      context.menuItems.push({
        title: "Delete",
        icon: "delete",
        onClick: async () => WeblinkStore.getInstance().removeById(this.getId()),
        confirm: {
          message: `Remove Web Link "${this.getName()}" from ${productName}?`,
        },
      });
    }

    catalogCategoryRegistry
      .getCategoryForEntity(this)
      ?.emit("contextMenuOpen", this, context);
  }
}

export class WebLinkCategory extends CatalogCategory {
  public readonly apiVersion = "catalog.k8slens.dev/v1alpha1";
  public readonly kind = "CatalogCategory";
  public metadata = {
    name: "Web Links",
    icon: "public",
  };
  public spec = {
    group: "entity.k8slens.dev",
    versions: [
      categoryVersion("v1alpha1", WebLink),
    ],
    names: {
      kind: "WebLink",
    },
  };
}

catalogCategoryRegistry.add(new WebLinkCategory());
