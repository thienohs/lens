/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import "@testing-library/jest-dom/extend-expect";
import { fireEvent, waitFor } from "@testing-library/react";
import fse from "fs-extra";
import React from "react";
import { UserStore } from "../../../../common/user-store";
import type { ExtensionDiscovery } from "../../../../extensions/extension-discovery/extension-discovery";
import type { ExtensionLoader } from "../../../../extensions/extension-loader";
import { ConfirmDialog } from "../../confirm-dialog";
import { Extensions } from "../extensions";
import mockFs from "mock-fs";
import { mockWindow } from "../../../../../__mocks__/windowMock";
import { getDiForUnitTesting } from "../../../getDiForUnitTesting";
import extensionLoaderInjectable from "../../../../extensions/extension-loader/extension-loader.injectable";
import { DiRender, renderFor } from "../../test-utils/renderFor";
import extensionDiscoveryInjectable from "../../../../extensions/extension-discovery/extension-discovery.injectable";
import directoryForUserDataInjectable from "../../../../common/app-paths/directory-for-user-data/directory-for-user-data.injectable";
import directoryForDownloadsInjectable from "../../../../common/app-paths/directory-for-downloads/directory-for-downloads.injectable";
import getConfigurationFileModelInjectable from "../../../../common/get-configuration-file-model/get-configuration-file-model.injectable";
import appVersionInjectable from "../../../../common/get-configuration-file-model/app-version/app-version.injectable";
import assert from "assert";

mockWindow();

jest.setTimeout(30000);
jest.mock("fs-extra");
jest.mock("../../notifications");

jest.mock("../../../../common/utils/downloadFile", () => ({
  downloadFile: jest.fn(({ url }) => ({
    promise: Promise.resolve(),
    url,
    cancel: () => {},
  })),
  downloadJson: jest.fn(({ url }) => ({
    promise: Promise.resolve({}),
    url,
    cancel: () => { },
  })),
}));

jest.mock("../../../../common/utils/tar");

describe("Extensions", () => {
  let extensionLoader: ExtensionLoader;
  let extensionDiscovery: ExtensionDiscovery;
  let render: DiRender;

  beforeEach(async () => {
    const di = getDiForUnitTesting({ doGeneralOverrides: true });

    di.override(directoryForUserDataInjectable, () => "some-directory-for-user-data");
    di.override(directoryForDownloadsInjectable, () => "some-directory-for-downloads");

    di.permitSideEffects(getConfigurationFileModelInjectable);
    di.permitSideEffects(appVersionInjectable);

    mockFs({
      "some-directory-for-user-data": {},
    });

    await di.runSetups();

    render = renderFor(di);

    extensionLoader = di.inject(extensionLoaderInjectable);
    extensionDiscovery = di.inject(extensionDiscoveryInjectable);

    extensionLoader.addExtension({
      id: "extensionId",
      manifest: {
        name: "test",
        version: "1.2.3",
      },
      absolutePath: "/absolute/path",
      manifestPath: "/symlinked/path/package.json",
      isBundled: false,
      isEnabled: true,
      isCompatible: true,
    });

    extensionDiscovery.uninstallExtension = jest.fn(() => Promise.resolve());

    UserStore.createInstance();
  });

  afterEach(() => {
    mockFs.restore();
    UserStore.resetInstance();
  });

  it("disables uninstall and disable buttons while uninstalling", async () => {
    extensionDiscovery.isLoaded = true;

    const res = render(<><Extensions /><ConfirmDialog /></>);
    const table = res.getByTestId("extensions-table");
    const menuTrigger = table.querySelector("div[role=row]:first-of-type .actions .Icon");

    assert(menuTrigger);

    fireEvent.click(menuTrigger);

    expect(res.getByText("Disable")).toHaveAttribute("aria-disabled", "false");
    expect(res.getByText("Uninstall")).toHaveAttribute("aria-disabled", "false");

    fireEvent.click(res.getByText("Uninstall"));

    // Approve confirm dialog
    fireEvent.click(res.getByText("Yes"));

    await waitFor(() => {
      expect(extensionDiscovery.uninstallExtension).toHaveBeenCalled();
      fireEvent.click(menuTrigger);
      expect(res.getByText("Disable")).toHaveAttribute("aria-disabled", "true");
      expect(res.getByText("Uninstall")).toHaveAttribute("aria-disabled", "true");
    }, {
      timeout: 30000,
    });
  });

  it("disables install button while installing", async () => {
    const res = render(<Extensions />);

    (fse.unlink as jest.MockedFunction<typeof fse.unlink>).mockReturnValue(Promise.resolve());

    fireEvent.change(res.getByPlaceholderText("File path or URL", {
      exact: false,
    }), {
      target: {
        value: "https://test.extensionurl/package.tgz",
      },
    });

    fireEvent.click(res.getByText("Install"));
    expect(res.getByText("Install").closest("button")).toBeDisabled();
  });

  it("displays spinner while extensions are loading", () => {
    extensionDiscovery.isLoaded = false;
    const { container } = render(<Extensions />);

    expect(container.querySelector(".Spinner")).toBeInTheDocument();
  });

  it("does not display the spinner while extensions are not loading", async () => {
    extensionDiscovery.isLoaded = true;
    const { container } = render(<Extensions />);

    expect(container.querySelector(".Spinner")).not.toBeInTheDocument();
  });
});
