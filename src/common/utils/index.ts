/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

/**
 * A function that does nothing
 */
export function noop<T extends any[]>(...args: T): void {
  return void args;
}

export * from "./abort-controller";
export * from "./app-version";
export * from "./autobind";
export * from "./camelCase";
export * from "./cloneJson";
export * from "./cluster-id-url-parsing";
export * from "./collection-functions";
export * from "./convertCpu";
export * from "./convertMemory";
export * from "./debouncePromise";
export * from "./delay";
export * from "./disposer";
export * from "./downloadFile";
export * from "./escapeRegExp";
export * from "./formatDuration";
export * from "./getRandId";
export * from "./hash-set";
export * from "./n-fircate";
export * from "./objects";
export * from "./openBrowser";
export * from "./paths";
export * from "./promise-exec";
export * from "./reject-promise";
export * from "./singleton";
export * from "./sort-compare";
export * from "./splitArray";
export * from "./tar";
export * from "./toJS";
export * from "./type-narrowing";
export * from "./wait-for-path";

export type { Tuple } from "./tuple";

import * as iter from "./iter";
import * as array from "./array";
import * as tuple from "./tuple";
import * as base64 from "./base64";

export {
  iter,
  array,
  tuple,
  base64,
};
