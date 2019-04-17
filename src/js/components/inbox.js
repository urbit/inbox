import React, { Component } from 'react';
import { InboxRecentPage } from '/components/inbox/recent';
import { InboxAllPage } from '/components/inbox/all';
import classnames from 'classnames';

export class InboxPage extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let content;

    if (this.props.store.views.inbox === "inbox-recent") {
      content = <InboxRecentPage {...this.props} />;
    } else if (this.props.store.views.inbox === "inbox-list") {
      content = <InboxAllPage {...this.props} />;
    }

    return (
      <div className="inbox-page container">
        {content}
      </div>
    );
  }
}
