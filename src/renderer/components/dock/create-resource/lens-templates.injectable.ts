/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import path from "path";
import { hasCorrectExtension } from "./has-correct-extension";
import { staticFilesDirectory } from "../../../../common/vars";
import readFileInjectable from "../../../../common/fs/read-file.injectable";
import readDirInjectable from "../../../../common/fs/read-dir.injectable";
import type { RawTemplates } from "./create-resource-templates.injectable";
import getAbsolutePathInjectable, { GetAbsolutePath } from "../../../../common/path/get-absolute-path.injectable";

interface Dependencies {
  readDir: (dirPath: string) => Promise<string[]>;
  readFile: (filePath: string) => Promise<string>;
  getAbsolutePath: GetAbsolutePath;
}

async function getTemplates({ readDir, readFile, getAbsolutePath }: Dependencies) {
  const templatesFolder = getAbsolutePath(staticFilesDirectory, "../templates/create-resource");

  /**
   * Mapping between file names and their contents
   */
  const templates: [file: string, contents: string][] = [];

  for (const dirEntry of await readDir(templatesFolder)) {
    if (hasCorrectExtension(dirEntry)) {
      templates.push([path.parse(dirEntry).name, await readFile(path.join(templatesFolder, dirEntry))]);
    }
  }

  return templates;
}

const lensCreateResourceTemplatesInjectable = getInjectable({
  id: "lens-create-resource-templates",

  instantiate: async (di): Promise<RawTemplates> => {
    const templates = await getTemplates({
      readFile: di.inject(readFileInjectable),
      readDir: di.inject(readDirInjectable),
      getAbsolutePath: di.inject(getAbsolutePathInjectable),
    });

    return ["lens", templates];
  },
});

export default lensCreateResourceTemplatesInjectable;
