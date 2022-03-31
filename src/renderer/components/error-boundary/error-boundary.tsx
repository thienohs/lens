/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import "./error-boundary.scss";

import React, { ErrorInfo } from "react";
import { observer } from "mobx-react";
import { Button } from "../button";
import { navigation } from "../../navigation";
import { issuesTrackerUrl, slackUrl } from "../../../common/vars";

export interface ErrorBoundaryProps {
}

interface State {
  error?: Error;
  errorInfo?: ErrorInfo;
}

@observer
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  public state: State = {};

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
  }

  back = () => {
    this.setState({ error: undefined, errorInfo: undefined });
    navigation.goBack();
  };

  render() {
    const { error, errorInfo } = this.state;

    if (error) {
      const slackLink = <a href={slackUrl}
        rel="noreferrer"
        target="_blank">Slack</a>;
      const githubLink = <a href={issuesTrackerUrl}
        rel="noreferrer"
        target="_blank">Github</a>;
      const pageUrl = location.pathname;

      return (
        <div className="ErrorBoundary flex column gaps">
          <h5>
            App crash at <span className="contrast">{pageUrl}</span>
          </h5>
          <p>
            To help us improve the product please report bugs to {slackLink} community or {githubLink} issues tracker.
          </p>
          <div className="wrapper">
            <code className="block">
              <p className="contrast">Component stack:</p>
              {errorInfo?.componentStack}
            </code>
            <code className="block">
              <p className="contrast">Error stack:</p>
              {error.stack}
            </code>
          </div>
          <Button
            className="box self-flex-start"
            primary
            label="Back"
            onClick={this.back}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
