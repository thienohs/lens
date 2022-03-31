/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import { observer } from "mobx-react";
import { Input, InputValidator } from "../input";
import type { CreateHotbarData, CreateHotbarOptions } from "../../../common/hotbar-types";
import { withInjectables } from "@ogre-tools/injectable-react";
import commandOverlayInjectable from "../command-palette/command-overlay.injectable";
import hotbarStoreInjectable from "../../../common/hotbar-store.injectable";
import uniqueHotbarNameInjectable from "../input/validators/unique-hotbar-name.injectable";

interface Dependencies {
  closeCommandOverlay: () => void;
  addHotbar: (data: CreateHotbarData, { setActive }?: CreateHotbarOptions) => void;
  uniqueHotbarName: InputValidator<boolean>;
}

const NonInjectedHotbarAddCommand = observer(({ closeCommandOverlay, addHotbar, uniqueHotbarName }: Dependencies) => {
  const onSubmit = (name: string) => {
    if (!name.trim()) {
      return;
    }

    addHotbar({ name }, { setActive: true });
    closeCommandOverlay();
  };

  return (
    <>
      <Input
        placeholder="Hotbar name"
        autoFocus={true}
        theme="round-black"
        data-test-id="command-palette-hotbar-add-name"
        validators={uniqueHotbarName}
        onSubmit={onSubmit}
        dirty={true}
        showValidationLine={true}
      />
      <small className="hint">
        Please provide a new hotbar name (Press &quot;Enter&quot; to confirm or &quot;Escape&quot; to cancel)
      </small>
    </>
  );
});

export const HotbarAddCommand = withInjectables<Dependencies>(NonInjectedHotbarAddCommand, {
  getProps: (di, props) => ({
    closeCommandOverlay: di.inject(commandOverlayInjectable).close,
    addHotbar: di.inject(hotbarStoreInjectable).add,
    uniqueHotbarName: di.inject(uniqueHotbarNameInjectable),
    ...props,
  }),
});
