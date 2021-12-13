/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import styles from "./avatar.module.scss";

import React, { HTMLAttributes } from "react";
import randomColor from "randomcolor";
import { cssNames } from "../../utils";

export interface AvatarProps extends HTMLAttributes<HTMLElement> {
  colorHash?: string;
  size?: number;
  background?: string;
  variant?: "circle" | "rounded" | "square";
  disabled?: boolean;
}

export const Avatar = ({
  variant = "rounded",
  size = 32,
  colorHash,
  children,
  background,
  className,
  disabled,
  ...rest
}: AvatarProps) => (
  <div
    className={cssNames(styles.Avatar, {
      [styles.circle]: variant == "circle",
      [styles.rounded]: variant == "rounded",
      [styles.disabled]: disabled,
    }, className)}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: background || randomColor({ seed: colorHash, luminosity: "dark" }),
    }}
    {...rest}
  >
    {children}
  </div>
);
