/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { apiPrefix } from "../../../../common/vars";
import { helmService, InstallChartArgs } from "../../../helm/helm-service";
import { getRouteInjectable } from "../../../router/router.injectable";
import Joi from "joi";
import { route } from "../../../router/route";

const installChartArgsValidator = Joi.object<InstallChartArgs, true, InstallChartArgs>({
  chart: Joi
    .string()
    .required(),
  values: Joi
    .object()
    .required()
    .unknown(true),
  name: Joi
    .string()
    .required(),
  namespace: Joi
    .string()
    .required(),
  version: Joi
    .string()
    .required(),
});

const installChartRouteInjectable = getRouteInjectable({
  id: "install-chart-route",

  instantiate: () => route({
    method: "post",
    path: `${apiPrefix}/v2/releases`,
  })(async ({ payload, cluster }) => {
    const result = installChartArgsValidator.validate(payload);

    if (result.error) {
      return {
        error: result.error,
      };
    }

    return {
      response: await helmService.installChart(cluster, result.value),
      statusCode: 201,
    };
  }),
});

export default installChartRouteInjectable;
