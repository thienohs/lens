/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { promiseExecFile } from "../../common/utils/promise-exec";
import type { BaseEncodingOptions } from "fs";
import type { ExecFileOptions, ExecFileOptionsWithStringEncoding } from "child_process";
import { helmBinaryPath } from "../../common/vars";
import { isChildProcessError } from "../../common/utils";

/**
 * ExecFile the bundled helm CLI
 * @returns STDOUT
 */
export async function execHelm(args: string[], { encoding, ...rest }: BaseEncodingOptions & ExecFileOptions = {}): Promise<string> {
  const options: ExecFileOptionsWithStringEncoding = {
    encoding: encoding ?? "utf-8",
    ...rest,
  };

  try {
    const { stdout } = await promiseExecFile(helmBinaryPath.get(), args, options);

    return stdout;
  } catch (error) {
    if (isChildProcessError(error, "string")) {
      throw error.stderr || error;
    }

    throw error;
  }
}
