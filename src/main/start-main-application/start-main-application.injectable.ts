/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import {
  DiContainerForInjection,
  getInjectable,
  getInjectionToken,
  InjectionToken,
} from "@ogre-tools/injectable";

import electronAppInjectable from "../app-paths/get-electron-app-path/electron-app/electron-app.injectable";

const startMainApplicationInjectable = getInjectable({
  id: "start-main-application",

  instantiate: (di) => {
    const runMany = runManyFor(di);
    const app = di.inject(electronAppInjectable);

    const runManyBeforeApplicationIsReady = runMany(
      beforeApplicationIsReadyInjectionToken,
    );

    const runManyAfterApplicationIsReady = runMany(
      onApplicationIsReadyInjectionToken,
    );

    const runManyForSecondApplicationInstance = runMany(
      onSecondApplicationInstanceInjectionToken,
    );

    const runManyForApplicationActivation = runMany(
      onApplicationActivationInjectionToken,
    );

    const runManyForApplicationQuit = runMany(onApplicationQuitInjectionToken);

    const runManyForOpenOfUrl = runMany(onOpenOfUrlInjectionToken);

    return async () => {
      await runManyBeforeApplicationIsReady();

      app.on("ready", async () => {
        await runManyAfterApplicationIsReady();
      });

      app.on("second-instance", async (_, commandLineArguments) => {
        await runManyForSecondApplicationInstance({ commandLineArguments });
      });

      app.on("activate", async (_, hasVisibleWindows) => {
        await runManyForApplicationActivation({ hasVisibleWindows });
      });

      app.on("will-quit", async (event) => {
        await runManyForApplicationQuit({ event });
      });

      app.on("open-url", async (event, url) => {
        await runManyForOpenOfUrl({ event, url });
      });
    };
  },
});

export default startMainApplicationInjectable;

export const beforeApplicationIsReadyInjectionToken =
  getInjectionToken<Runnable>({
    id: "before-application-is-ready",
  });

export const onApplicationIsReadyInjectionToken = getInjectionToken<Runnable>({
  id: "on-application-is-ready",
});

export const onSecondApplicationInstanceInjectionToken = getInjectionToken<
  Runnable<{ commandLineArguments: string[] }>
>({
  id: "on-second-application-instance",
});

export const onApplicationActivationInjectionToken = getInjectionToken<
  Runnable<{ hasVisibleWindows: boolean }>
>({
  id: "on-application-activation",
});

export const onApplicationQuitInjectionToken = getInjectionToken<
  Runnable<{ event: Electron.Event }>
>({
  id: "on-application-quit",
});

export const onOpenOfUrlInjectionToken = getInjectionToken<
  Runnable<{
    event: Electron.Event;
    url: string;
  }>
>({
  id: "on-open-of-url",
});

export interface Runnable<TParameter = void> {
  run: (parameter: TParameter) => Promise<void> | void;
}

export const runManyFor =
  (di: DiContainerForInjection) =>
  <TRunnable extends Runnable<unknown>>(
      injectionToken: InjectionToken<TRunnable, void>,
    ) =>
      async (...parameter: Parameters<TRunnable["run"]>) =>
        await Promise.all(
          di.injectMany(injectionToken).map((runnable) => runnable.run(parameter)),
        );
