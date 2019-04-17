import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { warehouse } from '/warehouse';
import { operator } from '/operator';
import { getQueryParams, isProxyHosted } from '/lib/util';
import { api } from '/api';
import { Root } from '/components/root';
import { PAGE_STATUS_TRANSITIONING, PAGE_STATUS_READY, REPORT_PAGE_STATUS } from '/lib/constants';

class UrbitRouter {
  constructor() {
    this.transitionTo = this.transitionTo.bind(this);
    this.metaPressed = false;
  }

  start() {
    if (warehouse) {
      this.scaffold = document.querySelectorAll("#root")[0].innerHTML;
      this.renderRoot();

      this.registerAnchorListeners();
      this.registerHistoryListeners();
    } else {
      console.error("~~~ ERROR: Must initialize warehouse before operation ~~~");
    }
  }

  renderRoot() {
    let rootComponent = (
      <Root
        api={api}
        store={warehouse.store}
        storeReports={warehouse.storeReports}
        pushCallback={warehouse.pushCallback}
        localSet={warehouse.localSet}
        localGet={warehouse.localGet}
        transitionTo={this.transitionTo}
        runPoll={operator.runPoll.bind(operator)}
        scaffold={this.scaffold} />
    )

    ReactDOM.render(rootComponent, document.querySelectorAll("#root")[0]);
  }

  linkType(path) {
    if (path.endsWith("?edit=true")) {
      // special casing this because it's cleaner than how it exists now
      return "edit-page";
    } else if (path.split("/")[2] != `~${api.authTokens.ship}`) {
      return "foreign";
    } else {
      return "local";
    }
  }

  filterUrl(url) {
    let path = url.split("?");
    let linkType = this.linkType(url);

    switch (linkType) {
      case "edit-page":
//        if (url.split("/")[2] != `~${api.authTokens.ship}`) {
          path[0] += ".x-htm";
//        } else {
//          path[0] += ".htm";
//        }
        break;
      case "foreign":
        path[0] += ".x-htm";
        break;
    }

    return path.join("?");
  }

  transitionTo(targetUrl, noHistory) {
    warehouse.storeReports([{
      type: REPORT_PAGE_STATUS,
      data: PAGE_STATUS_TRANSITIONING
    }]);

    // TODO: Extremely brittle. Expecting parts of form: /~~/pages/nutalk + /show
    fetch(this.filterUrl(targetUrl), {credentials: "same-origin"}).then((res) => {
      return res.text();
    }).then((resText) => {
      if (!noHistory) {
        window.history.pushState({}, null, targetUrl);
      }

      this.scaffold = this.extractBody(resText) || resText;

      warehouse.storeReports([{
        type: REPORT_PAGE_STATUS,
        data: PAGE_STATUS_READY
      }, {
        type: "menu.toggle",
        data: {open: false}
      }]);
    });
  }

  extractBody(scaffold) {
    let parser = new DOMParser();
    let tempDOM = parser.parseFromString(scaffold, "text/html");
    let bodyQuery = tempDOM.querySelectorAll('#root')[0];
    return bodyQuery && bodyQuery.innerHTML;
  }

  registerAnchorListeners() {
    window.document.addEventListener('keydown', (e) => {
      // TODO:  Verify this works on Windows systems...
      if (e.metaKey) {
        this.metaPressed = true;
      }
    });

    window.document.addEventListener('keyup', (e) => {
      this.metaPressed = false;
    });

    window.document.addEventListener('click', (e) => {
      // If meta isn't currnetly held down, resolve clicks normally
      if (!this.metaPressed) {
        // Walk the event target's parents to find 'a' tags up the chain
        let el = e.target;
        while (el && el.tagName != 'A') {
          el = el.parentNode;
        }
        // If you find an "a" tag in the clicked element's parents, it's a link
        if (el && !el.attributes.disabled) {
          // We can probably do something a little nicer
          if (el.hostname === "localhost" || isProxyHosted(el.hostname) || /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.exec(el.hostname)) {
            e.preventDefault();
            this.transitionTo(el.pathname + el.search);
          }
        }
      }
    });
  }

  registerHistoryListeners() {
    window.onpopstate = (state) => {
      this.transitionTo(window.location.pathname + window.location.search, true);
    }
  }
}

export let router = new UrbitRouter();
window.router = router;
