/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { chunk } from "lodash";
import { connect, ConnectionOptions } from "tls";
import url from "url";
import { apiKubePrefix } from "../../common/vars";
import type { ProxyApiRequestArgs } from "./types";

const skipRawHeaders = new Set(["Host", "Authorization"]);

export async function kubeApiUpgradeRequest({ req, socket, head, cluster }: ProxyApiRequestArgs) {
  const proxyUrl = await cluster.contextHandler.resolveAuthProxyUrl() + req.url.replace(apiKubePrefix, "");
  const proxyCa = cluster.contextHandler.resolveAuthProxyCa();
  const apiUrl = url.parse(cluster.apiUrl);
  const pUrl = url.parse(proxyUrl);
  const connectOpts: ConnectionOptions = {
    port: pUrl.port ? parseInt(pUrl.port) : undefined,
    host: pUrl.hostname ?? undefined,
    ca: proxyCa,
  };

  const proxySocket = connect(connectOpts, () => {
    proxySocket.write(`${req.method} ${pUrl.path} HTTP/1.1\r\n`);
    proxySocket.write(`Host: ${apiUrl.host}\r\n`);

    for (const [key, value] of chunk(req.rawHeaders, 2)) {
      if (skipRawHeaders.has(key)) {
        continue;
      }

      proxySocket.write(`${key}: ${value}\r\n`);
    }

    proxySocket.write("\r\n");
    proxySocket.write(head);
  });

  proxySocket.setKeepAlive(true);
  socket.setKeepAlive(true);
  proxySocket.setTimeout(0);
  socket.setTimeout(0);

  proxySocket.on("data", function (chunk) {
    socket.write(chunk);
  });
  proxySocket.on("end", function () {
    socket.end();
  });
  proxySocket.on("error", function () {
    socket.write(`HTTP/${req.httpVersion} 500 Connection error\r\n\r\n`);
    socket.end();
  });
  socket.on("data", function (chunk) {
    proxySocket.write(chunk);
  });
  socket.on("end", function () {
    proxySocket.end();
  });
  socket.on("error", function () {
    proxySocket.end();
  });
}
