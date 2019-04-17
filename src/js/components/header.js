import React, { Component } from 'react';
import { Icon } from '/components/lib/icon';
import { getQueryParams, profileUrl, dateToDa } from '/lib/util';
import { getStationDetails } from '/services';
import { Button } from '/components/lib/button';
import { PageStatus } from '/components/lib/page-status';
import { REPORT_PAGE_STATUS, REPORT_NAVIGATE, PAGE_STATUS_TRANSITIONING, PAGE_STATUS_READY, PAGE_STATUS_PROCESSING, PAGE_STATUS_RECONNECTING, PAGE_STATUS_DISCONNECTED, LANDSCAPE_ROOT } from '/lib/constants';
import classnames from 'classnames';
import _ from 'lodash';

export class Header extends Component {
  constructor(props) {
    super(props);

    this.toggleSubscribe = this.toggleSubscribe.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
    this.handleHeaderAction = this.handleHeaderAction.bind(this);
  }

  isSubscribed(station) {
    let inboxSrc = this.props.store.messages.inbox.src;
    if (!inboxSrc) return false;
    return inboxSrc.includes(station);
  }

  toggleSubscribe() {
    let subscribed = this.isSubscribed(this.props.data.station);
    let stationDetails = getStationDetails(this.props.data.station);

    this.props.api.hall({
      source: {
        nom: 'inbox',
        sub: !subscribed,
        srs: [this.props.data.station]
      }
    });
  }

  toggleMenu() {
    this.props.storeReports([{
      type: "menu.toggle",
      data: {open: true}
    }]);
  }

  getStationHeaderData(station) {
    let stationDetails = getStationDetails(station);

    return {
      title: {
        display: stationDetails.stationTitle,
        href: stationDetails.stationUrl
      },
      breadcrumbs: [{
        display: `~${stationDetails.host}`,
        href: stationDetails.hostProfileUrl
      }],
      station,
      stationDetails
    }
  }

  getHeaderData(type) {
    let headerData = {};
    let defaultData;
    let actions = {};

    switch (type) {
      case "stream-chat":
        defaultData = this.getStationHeaderData(this.props.data.station);
        headerData = {
          ...defaultData,
          icon: 'icon-stream-chat',
          title: {
            ...defaultData.title,
            style: "mono"
          },
          actions: {
            subscribe: null,
            details: defaultData.stationDetails.stationDetailsUrl,
          },
        }
        break;

      case "collection-index-default":
        defaultData = this.getStationHeaderData(this.props.data.station);

        actions = {
          write: `/~~/${this.props.data.author}/==/web/collections/${this.props.data.collId}?show=post`,
          subscribe: null,
          details: `/~~/${this.props.data.author}/==/web/collections/${this.props.data.collId}?show=details`,
        }

        headerData = {
          ...defaultData,
          icon: 'icon-collection-index',
          title: {
            ...defaultData.title,
            display: (this.props.data.title) ? this.props.data.title : defaultData.title.display
          },
          actions: actions
        }
        break;

      case "collection-index-post": // TODO: should probably be 'collection-post-write'
      case "collection-post-edit":
      case "collection-post-default":
        defaultData = this.getStationHeaderData(this.props.data.station);

        if (this.props.data.subtype === 'default') {
          actions = {
            edit: `/~~/${this.props.data.host}/==/web/collections/${this.props.data.collId}/${this.props.data.postId}?show=edit`
          }
        }

        let icon = "icon-collection-post";
        if (this.props.data.type === "collection-post-default") icon = "icon-collection-comment";

        let title = {
          display: this.props.data.title,
          href: defaultData.title.href
        }

        if (this.props.data.type === "collection-index-post") {
          title = {
            display: "New post",
            href: "javascript:void(0)"
          }
        }

        headerData = {
          ...defaultData,
          icon,
          title,
          breadcrumbs: [
            defaultData.breadcrumbs[0],
            {
              display: this.props.data.collTitle,
              href: `/~~/${this.props.data.host}/==/web/collections/${this.props.data.collId}`
            }
          ],
          actions
        }
        break;

      case "header-profile":
        headerData = {
          icon: 'icon-sig',
          title: {
            display: this.props.data.author.substr(1),
            href: profileUrl(this.props.data.author.substr(1)),
            style: "mono"
          }
        }
        break;

      case "stream-dm":
        headerData = {
          icon: 'icon-stream-dm'
        }
        break;
      case "collection-write":
        headerData = {
          icon: 'icon-collection-post'
        }
        break;
      case "header-inbox":
        headerData = {
          title: {
            display: "Inbox",
            href: LANDSCAPE_ROOT
          },
          icon: 'icon-inbox',
        }
        break;
      case "header-default":
      default:
        headerData = {
          title: {
            display: "Inbox",
            href: LANDSCAPE_ROOT
          },
          icon: 'icon-inbox'
        }
        break;
    }

    headerData.type = type;

    return headerData;
  }

  navigateSubpage(page, view) {
    this.props.storeReports([{
      type: REPORT_NAVIGATE,
      data: {page, view}
    }]);
  }

  buildHeaderCarpet(headerData) {
    switch (headerData.type) {
      case "header-inbox":
        let recentClass = classnames({
          'vanilla': true,
          'mr-8': true,
          'inbox-link': true,
          'inbox-link-active': warehouse.store.views.inbox === "inbox-recent",
        });

        let listClass = classnames({
          'vanilla': true,
          'inbox-link': true,
          'inbox-link-active': warehouse.store.views.inbox === "inbox-list",
        });
        return (
          <React.Fragment>
            <div className="flex-col-2"></div>
            <div className="flex-col-x text-heading text-squat">
              <a className={recentClass} onClick={() => { this.navigateSubpage('inbox', 'inbox-recent') }}>Recent</a>
              <a className={listClass} onClick={() => { this.navigateSubpage('inbox', 'inbox-list') }}>All</a>
            </div>
          </React.Fragment>
        );

        break;
      case "collection-index-post":
      case "collection-post-edit":
      case "collection-post-default":
        // <Elapsed timestring={parseInt(this.state.activatedMsg.date, 10)} classes="ml-5 mr-2 text-timestamp" />

        let authorElem = null;

        // TODO: I realize the redundancy in this conditional. God forgive me.
        if (this.props.data.author && headerData.type !== "collection-index-post") {
          authorElem = (
            <a href={profileUrl(this.props.data.author.substr(1))} className="vanilla text-mono mr-3 text-700 text-small">{this.props.data.author}</a>
          )
        }

        return (
          <React.Fragment>
            <div className="flex-col-2"></div>
            <div className="flex-col-x">
              {authorElem}
              <span className="text-mono text-300 text-small">{this.props.data.dateCreated.slice(0, -6)}</span>
            </div>
          </React.Fragment>
        );
        break;
      case "header-profile":
        let onSettingsPage = window.location.href.includes("settings");
        let indexClass = classnames({
          'vanilla': true,
          'mr-8': true,
          'inbox-link': true,
          'inbox-link-active': !onSettingsPage,
        });
        let settingsClass = classnames({
          'vanilla': true,
          'inbox-link': true,
          'inbox-link-active': onSettingsPage,
        });
        return (
          <React.Fragment>
            <div className="flex-col-2"></div>
            <div className="flex-col-x text-heading text-squat">
              <a className={indexClass} href={`/~~/${this.props.data.author}/==/web/landscape/profile`}>Profile</a>
              {this.props.data.author.substr(1) === this.props.api.authTokens.ship &&
                <a className={settingsClass} href={`/~~/${this.props.data.author}/==/web/landscape/profile/settings`}>Settings</a>
              }
            </div>
          </React.Fragment>
        );
        break;
    }
  }

  buildHeaderBreadcrumbs(headerData) {
    if (headerData.breadcrumbs) {
      return headerData.breadcrumbs.map(({display, href}, i) => {
        return (
          <React.Fragment>
            <a className="text-host-breadcrumb" key={display} href={href}>{display}</a>
            <span className="text-host-breadcrumb text-600 ml-2 mr-2">/</span>
          </React.Fragment>
        )
      })
    }

    return null;
  }

  handleHeaderAction(e) {
    if (e.currentTarget.dataset["key"] === "subscribe") {
      e.preventDefault();

      this.props.storeReports([{
        type: REPORT_PAGE_STATUS,
        data: PAGE_STATUS_PROCESSING
      }]);

      this.toggleSubscribe();

      this.props.pushCallback("circle.config.dif.source", rep => {
        this.props.storeReports([{
          type: REPORT_PAGE_STATUS,
          data: PAGE_STATUS_READY
        }]);
      });
    }
  }

  buildHeaderActions(headerData) {
    if (headerData.actions) {
      return Object.arrayify(headerData.actions).map(({key, value}) => {
        let lusElem = null;
        let labelElem = key;

        switch (key) {
          case "details":
            labelElem = (<Icon type="icon-ellipsis" />);
            return null;  // Remove "details" page for now
            break;
          case "subscribe":
            labelElem = this.isSubscribed(headerData.station) ? "Unsubscribe" : "Subscribe";
            return null;  // Remove "subscribe" action for now
            break;
          case "write":
            lusElem = key === "write" ? (<Icon type="icon-lus" label={true} />) : null;
            break;
        }

        // TODO: No idea why .key and .href aren't showing up in the attributes
        // in currentTarget when you click this. Bad javascript, bad!
        return (
          <a key={key} href={value} onClick={this.handleHeaderAction} data-key={key} className="header-link mr-6 flex align-center">
            {lusElem}
            <span>{labelElem}</span>
          </a>
        );
      })
    }

    return null;
  }

  buildHeaderContent(headerData) {
    let actions, subscribeClass, subscribeLabel, breadcrumbsElem, headerClass,
      headerCarpet;

    actions = this.buildHeaderActions(headerData);
    breadcrumbsElem = this.buildHeaderBreadcrumbs(headerData);
    headerCarpet = this.buildHeaderCarpet(headerData);

    headerClass = classnames({
      'flex-col-x': true,
      'header-title': true,
      'text-mono': headerData.title && headerData.title.style === "mono"
    })

    return (
      <div className="container header-container">
        <div className="row">
          <div className="flex-col-2"></div>
          <div className="flex-col-x header-breadcrumbs">
            {breadcrumbsElem}
          </div>
        </div>
        <div className="row align-center header-mainrow">
          <div className="flex-col-1 flex justify-end">
            <HeaderNotification
              notifications={this.props.store.messages.notifications}
              pushCallback={this.props.pushCallback}
            />
          </div>
          <div className="flex-col-1 flex space-between align-center">
            <a onClick={this.toggleMenu}>
              <Icon type="icon-panini" />
            </a>
            <Icon type={headerData.icon} label={true} />
          </div>
          <h1 className={headerClass}>
            <a href={headerData.title.href}>{headerData.title.display}</a>
          </h1>
          {actions}
        </div>
        <div className="row header-carpet">
          {headerCarpet}
        </div>
        <PageStatus
          transition={this.props.store.views.transition}
          usership={this.props.api.authTokens.ship}
          runPoll={this.props.runPoll}
          storeReports={this.props.storeReports}
        />
      </div>
    )
  }

  render() {
    let type = (this.props.data.type) ? this.props.data.type : "header-default";

    // TODO: This is an ugly hack until we fix queryParams
    if (["stream-chat", "header-stream-dm", "collection-edit"].includes(type) && !getQueryParams().station) {
      return null;
    }

    let headerData = this.getHeaderData(type);
    let headerContent = this.buildHeaderContent(headerData);

    return headerContent;
  }
}

class HeaderNotification extends Component {
  constructor(props) {
    super(props);

    this.state = {
      notificationClass: null
    }
  }

  componentDidMount() {
    this.props.pushCallback('dm.new', rep => {
      this.setState({
        notificationClass: "header-notifications-flash"
      });

      setTimeout(() => {
        this.setState({
          notificationClass: null
        });
      }, 5000);

      return false;
    })
  }

  render() {
    let notificationHref;

    if (this.props.notifications.length > 0) {
      notificationHref = this.props.notifications[0].stationDetails.stationUrl;
    }

    return (
      <React.Fragment>
        {this.props.notifications.length > 0 &&
          <a className="vanilla" href={notificationHref}>
            <div className={`header-notifications text-mono text-700 ${this.state.notificationClass}`}>{this.props.notifications.length}</div>
          </a>
        }
      </React.Fragment>
    )
  }
}
