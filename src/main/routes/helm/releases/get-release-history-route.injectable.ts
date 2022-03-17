/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { apiPrefix } from "../../../../common/vars";
import { helmService } from "../../../helm/helm-service";
import { getRouteInjectable } from "../../../router/router.injectable";
import { route } from "../../../router/route";

const getReleaseRouteHistoryInjectable = getRouteInjectable({
  id: "get-release-history-route",

  instantiate: () => route({
    method: "get",
    path: `${apiPrefix}/v2/releases/{namespace}/{release}/history`,
  })(async (request) => {
    const { cluster, params } = request;

    return {
      response: await helmService.getReleaseHistory(
        cluster,
        params.release,
        params.namespace,
      ),
    };
  }),
});

export default getReleaseRouteHistoryInjectable;
