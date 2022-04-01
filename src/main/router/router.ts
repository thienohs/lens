/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import Call from "@hapi/call";
import type http from "http";
import type httpProxy from "http-proxy";
import { toPairs } from "lodash/fp";
import type { Cluster } from "../../common/cluster/cluster";
import type { LensApiResultContentType } from "./router-content-types";
import { contentTypes } from "./router-content-types";

export interface RouterRequestOpts {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  cluster: Cluster;
  params: RouteParams;
  url: URL;
}

export interface RouteParams extends Record<string, string> {
  path?: string; // *-route
  namespace?: string;
  service?: string;
  account?: string;
  release?: string;
  repo?: string;
  chart?: string;
}

export interface LensApiRequest<P = any> {
  path: string;
  payload: P;
  params: RouteParams;
  cluster: Cluster;
  query: URLSearchParams;
  raw: {
    req: http.IncomingMessage;
    res: http.ServerResponse;
  };
}

interface Dependencies {
  parseRequest: (request: http.IncomingMessage, _: null, options: { parse: boolean; output: string }) => Promise<{ payload: any }>;
}

export class Router {
  protected router = new Call.Router();

  constructor(routes: Route<unknown>[], private dependencies: Dependencies) {
    routes.forEach(route => {
      this.router.add({ method: route.method, path: route.path }, handleRoute(route));
    });
  }

  public async route(cluster: Cluster, req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;
    const method = req.method.toLowerCase();
    const matchingRoute = this.router.route(method, path);
    const routeFound = !matchingRoute.isBoom;

    if (routeFound) {
      const request = await this.getRequest({ req, res, cluster, url, params: matchingRoute.params });

      await matchingRoute.route(request, res);

      return true;
    }

    return false;
  }

  protected async getRequest(opts: RouterRequestOpts): Promise<LensApiRequest> {
    const { req, res, url, cluster, params } = opts;

    const { payload } = await this.dependencies.parseRequest(req, null, {
      parse: true,
      output: "data",
    });

    return {
      cluster,
      path: url.pathname,
      raw: {
        req, res,
      },
      query: url.searchParams,
      payload,
      params,
    };
  }
}

export interface LensApiResult<TResult> {
  statusCode?: number;
  response?: TResult;
  error?: any;
  contentType?: LensApiResultContentType;
  headers?: { [name: string]: string };
  proxy?: httpProxy;
}

export type RouteHandler<TResponse> = (
  request: LensApiRequest
) =>
  | Promise<LensApiResult<TResponse>>
  | Promise<void>
  | LensApiResult<TResponse>
  | void;

export interface Route<TResponse> {
  path: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  handler: RouteHandler<TResponse>;
}

const handleRoute = (route: Route<unknown>) => async (request: LensApiRequest, response: http.ServerResponse) => {
  let result: LensApiResult<any> | void;

  const writeServerResponse = writeServerResponseFor(response);

  try {
    result = await route.handler(request);
  } catch(error) {
    const mappedResult = contentTypes.txt.resultMapper({
      statusCode: 500,
      error: error.toString(),
    });

    writeServerResponse(mappedResult);

    return;
  }

  if (!result) {
    const mappedResult = contentTypes.txt.resultMapper({
      statusCode: 204,
      response: undefined,
    });

    writeServerResponse(mappedResult);

    return;
  }

  if (result.proxy) {
    return;
  }

  const contentType = result.contentType || contentTypes.json;

  const mappedResult = contentType.resultMapper(result);

  writeServerResponse(mappedResult);
};

const writeServerResponseFor =
  (serverResponse: http.ServerResponse) =>
    ({
      statusCode,
      content,
      headers,
    }: {
    statusCode: number;
    content: any;
    headers: { [name: string]: string };
  }) => {
      serverResponse.statusCode = statusCode;

      const headerPairs = toPairs<string>(headers);

      headerPairs.forEach(([name, value]) => {
        serverResponse.setHeader(name, value);
      });

      if (content instanceof Buffer) {
        serverResponse.write(content);

        serverResponse.end();

        return;
      }

      if (content) {
        serverResponse.end(content);
      } else {
        serverResponse.end();
      }
    };
