/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { computed, IComputedValue, IObservableValue, observable, reaction } from "mobx";
import type { CatalogEntityRegistry } from "../../../api/catalog-entity-registry";
import type { CatalogEntity } from "../../../api/catalog-entity";
import { CatalogCategory, catalogCategoryRegistry } from "../../../../common/catalog";
import { Disposer, disposer } from "../../../../common/utils";
import type { ItemListStore } from "../../item-object-list";

interface Dependencies {
  registry: CatalogEntityRegistry;
}

export type CatalogEntityStore = ItemListStore<CatalogEntity, false> & {
  readonly entities: IComputedValue<CatalogEntity[]>;
  readonly activeCategory: IObservableValue<CatalogCategory | undefined>;
  readonly selectedItemId: IObservableValue<string | undefined>;
  readonly selectedItem: IComputedValue<CatalogEntity | undefined>;
  watch(): Disposer;
  onRun(entity: CatalogEntity): void;
};

export function catalogEntityStore({ registry }: Dependencies): CatalogEntityStore {
  const activeCategory = observable.box<CatalogCategory | undefined>(undefined);
  const selectedItemId = observable.box<string | undefined>(undefined);
  const entities = computed(() => {
    const category = activeCategory.get();

    return category
      ? registry.getItemsForCategory(category, { filtered: true })
      : registry.filteredItems;
  });
  const selectedItem = computed(() => {
    const id = selectedItemId.get();

    if (!id) {
      return undefined;
    }

    return entities.get().find(entity => entity.getId() === id);
  });
  const loadAll = () => {
    const category = activeCategory.get();

    if (category) {
      category.emit("load");
    } else {
      for (const category of catalogCategoryRegistry.items) {
        category.emit("load");
      }
    }
  };

  return {
    entities,
    selectedItem,
    activeCategory,
    selectedItemId,
    watch: () => disposer(
      reaction(() => entities.get(), loadAll),
      reaction(() => activeCategory.get(), loadAll, { delay: 100 }),
    ),
    onRun: entity => registry.onRun(entity),
    failedLoading: false,
    getTotalCount: () => registry.filteredItems.length,
    isLoaded: true,
    isSelected: (item) => item.getId() === selectedItemId.get(),
    isSelectedAll: () => false,
    pickOnlySelected: () => [],
    toggleSelection: () => {},
    toggleSelectionAll: () => {},
    removeSelectedItems: async () => {},
  };
}
