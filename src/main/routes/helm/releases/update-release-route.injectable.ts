/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { apiPrefix } from "../../../../common/vars";
import { helmService, UpdateChartArgs } from "../../../helm/helm-service";
import { getRouteInjectable } from "../../../router/router.injectable";
import { route } from "../../../router/route";
import Joi from "joi";

const updateChartArgsValidator = Joi.object<UpdateChartArgs, true, UpdateChartArgs>({
  chart: Joi
    .string()
    .required(),
  version: Joi
    .string()
    .required(),
  values: Joi
    .object()
    .unknown(true),
});

const updateReleaseRouteInjectable = getRouteInjectable({
  id: "update-release-route",

  instantiate: () => route({
    method: "put",
    path: `${apiPrefix}/v2/releases/{namespace}/{release}`,
  })(async ({ cluster, params, payload }) => {
    const result = updateChartArgsValidator.validate(payload);

    if (result.error) {
      return {
        error: result.error,
      };
    }

    return {
      response: await helmService.updateRelease(
        cluster,
        params.release,
        params.namespace,
        result.value,
      ),
    };
  }),
});

export default updateReleaseRouteInjectable;
