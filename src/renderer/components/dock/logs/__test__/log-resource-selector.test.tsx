/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import * as selectEvent from "react-select-event";
import { LogResourceSelector } from "../resource-selector";
import { dockerPod, deploymentPod1, deploymentPod2 } from "./pod.mock";
import { ThemeStore } from "../../../../theme.store";
import { UserStore } from "../../../../../common/user-store";
import mockFs from "mock-fs";
import { getDiForUnitTesting } from "../../../../getDiForUnitTesting";
import type { DiRender } from "../../../test-utils/renderFor";
import { renderFor } from "../../../test-utils/renderFor";
import directoryForUserDataInjectable from "../../../../../common/app-paths/directory-for-user-data/directory-for-user-data.injectable";
import callForLogsInjectable from "../call-for-logs.injectable";
import { LogTabViewModel, LogTabViewModelDependencies } from "../logs-view-model";
import type { TabId } from "../../dock/store";
import userEvent from "@testing-library/user-event";
import { SearchStore } from "../../../../search-store/search-store";
import getConfigurationFileModelInjectable from "../../../../../common/get-configuration-file-model/get-configuration-file-model.injectable";
import appVersionInjectable from "../../../../../common/get-configuration-file-model/app-version/app-version.injectable";
import assert from "assert";

jest.mock("electron", () => ({
  app: {
    getVersion: () => "99.99.99",
    getName: () => "lens",
    setName: jest.fn(),
    setPath: jest.fn(),
    getPath: () => "tmp",
    getLocale: () => "en",
    setLoginItemSettings: jest.fn(),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    invoke: jest.fn(),
  },
}));

function mockLogTabViewModel(tabId: TabId, deps: Partial<LogTabViewModelDependencies>): LogTabViewModel {
  return new LogTabViewModel(tabId, {
    getLogs: jest.fn(),
    getLogsWithoutTimestamps: jest.fn(),
    getTimestampSplitLogs: jest.fn(),
    getLogTabData: jest.fn(),
    setLogTabData: jest.fn(),
    loadLogs: jest.fn(),
    reloadLogs: jest.fn(),
    renameTab: jest.fn(),
    stopLoadingLogs: jest.fn(),
    getPodById: jest.fn(),
    getPodsByOwnerId: jest.fn(),
    searchStore: new SearchStore(),
    areLogsPresent: jest.fn(),
    ...deps,
  });
}

const getOnePodViewModel = (tabId: TabId, deps: Partial<LogTabViewModelDependencies> = {}): LogTabViewModel => {
  const selectedPod = dockerPod;

  return mockLogTabViewModel(tabId, {
    getLogTabData: () => ({
      selectedPodId: selectedPod.getId(),
      selectedContainer: selectedPod.getContainers()[0].name,
      namespace: selectedPod.getNs(),
      showPrevious: false,
      showTimestamps: false,
    }),
    getPodById: (id) => {
      if (id === selectedPod.getId()) {
        return selectedPod;
      }

      return undefined;
    },
    ...deps,
  });
};

const getFewPodsTabData = (tabId: TabId, deps: Partial<LogTabViewModelDependencies> = {}): LogTabViewModel => {
  const selectedPod = deploymentPod1;
  const anotherPod = deploymentPod2;

  return mockLogTabViewModel(tabId, {
    getLogTabData: () => ({
      owner: {
        uid: "uuid",
        kind: "Deployment",
        name: "super-deployment",
      },
      selectedPodId: selectedPod.getId(),
      selectedContainer: selectedPod.getContainers()[0].name,
      namespace: selectedPod.getNs(),
      showPrevious: false,
      showTimestamps: false,
    }),
    getPodById: (id) => {
      if (id === selectedPod.getId()) {
        return selectedPod;
      }

      if (id === anotherPod.getId()) {
        return anotherPod;
      }

      return undefined;
    },
    getPodsByOwnerId: (id) => {
      if (id === "uuid") {
        return [selectedPod, anotherPod];
      }

      return [];
    },
    ...deps,
  });
};

describe("<LogResourceSelector />", () => {
  let render: DiRender;

  beforeEach(async () => {
    const di = getDiForUnitTesting({ doGeneralOverrides: true });

    di.override(directoryForUserDataInjectable, () => "some-directory-for-user-data");
    di.override(callForLogsInjectable, () => () => Promise.resolve("some-logs"));

    di.permitSideEffects(getConfigurationFileModelInjectable);
    di.permitSideEffects(appVersionInjectable);

    render = renderFor(di);

    await di.runSetups();

    mockFs({
      "tmp": {},
    });

    UserStore.createInstance();
    ThemeStore.createInstance();
  });

  afterEach(() => {
    UserStore.resetInstance();
    ThemeStore.resetInstance();
    mockFs.restore();
  });

  it("renders w/o errors", () => {
    const model = getOnePodViewModel("foobar");
    const { container } = render(<LogResourceSelector model={model} />);

    expect(container).toBeInstanceOf(HTMLElement);
  });

  it("renders proper namespace", async () => {
    const model = getOnePodViewModel("foobar");
    const { findByTestId } = render(<LogResourceSelector model={model} />);
    const ns = await findByTestId("namespace-badge");

    expect(ns).toHaveTextContent("default");
  });

  it("renders proper selected items within dropdowns", async () => {
    const model = getOnePodViewModel("foobar");
    const { findByText } = render(<LogResourceSelector model={model} />);

    expect(await findByText("dockerExporter")).toBeInTheDocument();
    expect(await findByText("docker-exporter")).toBeInTheDocument();
  });

  it("renders sibling pods in dropdown", async () => {
    const model = getFewPodsTabData("foobar");
    const { container, findByText } = render(<LogResourceSelector model={model} />);
    const selector = container.querySelector<HTMLElement>(".pod-selector");

    assert(selector);

    selectEvent.openMenu(selector);
    expect(await findByText("deploymentPod2", { selector: ".pod-selector-menu .Select__option" })).toBeInTheDocument();
    expect(await findByText("deploymentPod1", { selector: ".pod-selector-menu .Select__option" })).toBeInTheDocument();
  });

  it("renders sibling containers in dropdown", async () => {
    const model = getFewPodsTabData("foobar");
    const { findByText, container } = render(<LogResourceSelector model={model} />);
    const selector = container.querySelector<HTMLElement>(".container-selector");

    assert(selector);

    selectEvent.openMenu(selector);

    expect(await findByText("node-exporter-1")).toBeInTheDocument();
    expect(await findByText("init-node-exporter")).toBeInTheDocument();
    expect(await findByText("init-node-exporter-1")).toBeInTheDocument();
  });

  it("renders pod owner as badge", async () => {
    const model = getFewPodsTabData("foobar");
    const { findByText } = render(<LogResourceSelector model={model} />);

    expect(await findByText("super-deployment", {
      exact: false,
    })).toBeInTheDocument();
  });

  it("updates tab name if selected pod changes", async () => {
    const renameTab = jest.fn();
    const model = getFewPodsTabData("foobar", { renameTab });
    const { findByText, container } = render(<LogResourceSelector model={model} />);
    const selector = container.querySelector<HTMLElement>(".pod-selector");

    assert(selector);

    selectEvent.openMenu(selector);
    userEvent.click(await findByText("deploymentPod2", { selector: ".pod-selector-menu .Select__option" }));
    expect(renameTab).toBeCalledWith("foobar", "Pod deploymentPod2");
  });
});
