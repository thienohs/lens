/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { apiPrefix } from "../../../../common/vars";
import { helmService } from "../../../helm/helm-service";
import { getRouteInjectable } from "../../../router/router.injectable";
import { route } from "../../../router/route";

const deleteReleaseRouteInjectable = getRouteInjectable({
  id: "delete-release-route",

  instantiate: () => route({
    method: "delete",
    path: `${apiPrefix}/v2/releases/{namespace}/{release}`,
  })(async ({ cluster, params }) => {
    const { release, namespace } = params;

    return {
      response: await helmService.deleteRelease(
        cluster,
        release,
        namespace,
      ),
    };
  }),
});

export default deleteReleaseRouteInjectable;
