/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { getInjectable } from "@ogre-tools/injectable";
import type { LensApiRequest, Route } from "../router/router";
import { contentTypes, SupportedFileExtension } from "../router/router-content-types";
import logger from "../logger";
import { routeInjectionToken } from "../router/router.injectable";
import { appName, publicPath, staticFilesDirectory } from "../../common/vars";
import path from "path";
import isDevelopmentInjectable from "../../common/vars/is-development.injectable";
import httpProxy from "http-proxy";
import readFileBufferInjectable from "../../common/fs/read-file-buffer.injectable";
import getAbsolutePathInjectable, { GetAbsolutePath } from "../../common/path/get-absolute-path.injectable";
import type { JoinPaths } from "../../common/path/join-paths.injectable";
import joinPathsInjectable from "../../common/path/join-paths.injectable";

interface ProductionDependencies {
  readFileBuffer: (path: string) => Promise<Buffer>;
  getAbsolutePath: GetAbsolutePath;
  joinPaths: JoinPaths;
}

const handleStaticFileInProduction =
  ({ readFileBuffer, getAbsolutePath, joinPaths }: ProductionDependencies) =>
    async ({ params }: LensApiRequest) => {
      const staticPath = getAbsolutePath(staticFilesDirectory);
      let filePath = params.path;

      for (let retryCount = 0; retryCount < 5; retryCount += 1) {
        const asset = joinPaths(staticPath, filePath);
        const normalizedFilePath = getAbsolutePath(asset);

        if (!normalizedFilePath.startsWith(staticPath)) {
          return { statusCode: 404 };
        }

        try {
          const fileExtension = path
            .extname(asset)
            .slice(1) as SupportedFileExtension;

          const contentType = contentTypes[fileExtension] || contentTypes.txt;

          return { response: await readFileBuffer(asset), contentType };
        } catch (err) {
          if (retryCount > 5) {
            logger.error("handleStaticFile:", err.toString());

            return { statusCode: 404 };
          }

          filePath = `${publicPath}/${appName}.html`;
        }
      }

      return { statusCode: 404 };
    };

interface DevelopmentDependencies {
  proxy: httpProxy;
}

const handleStaticFileInDevelopment =
  ({ proxy }: DevelopmentDependencies) =>
    (apiReq: LensApiRequest) => {
      const { req, res } = apiReq.raw;

      if (req.url === "/" || !req.url.startsWith("/build/")) {
        req.url = `${publicPath}/${appName}.html`;
      }

      proxy.web(req, res, {
        target: "http://127.0.0.1:8080",
      });

      return { proxy };
    };

const staticFileRouteInjectable = getInjectable({
  id: "static-file-route",

  instantiate: (di): Route<Buffer> => {
    const isDevelopment = di.inject(isDevelopmentInjectable);
    const readFileBuffer = di.inject(readFileBufferInjectable);
    const getAbsolutePath = di.inject(getAbsolutePathInjectable);
    const joinPaths = di.inject(joinPathsInjectable);

    return {
      method: "get",
      path: `/{path*}`,
      handler: isDevelopment
        ? handleStaticFileInDevelopment({ proxy: httpProxy.createProxy() })
        : handleStaticFileInProduction({ readFileBuffer, getAbsolutePath, joinPaths }),
    };
  },

  injectionToken: routeInjectionToken,
});

export default staticFileRouteInjectable;
