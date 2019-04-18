import React, { Component } from 'react';
import { BrowserRouter, Route } from "react-router-dom";

import { CommandMenu } from '/components/command';
import { Header } from '/components/header';
import { OnboardingPage } from '/components/onboarding';
import { InboxRecentPage } from '/components/recent';
import { InboxAllPage } from '/components/all';

import { api } from '/api';
import { warehouse } from '/warehouse';

export class Root extends Component {
  constructor(props) {
    super(props);

    this.state = {
      menuOpen: false
    };

    warehouse.pushCallback("menu.toggle", (rep) => {
      let newStatus = (rep.data) ? rep.data.open : !this.state.menuOpen;

      this.setState({
        menuOpen: newStatus
      });

      return false;
    });
  }

  loadHeader() {
    let headerData = {
      type: "default"
    }

    return (
      <Header
        data={headerData}
        api={api}
        store={warehouse.store}
        storeReports={warehouse.storeReports}
        pushCallback={warehouse.pushCallback}
        localSet={warehouse.localSet}
        localGet={warehouse.localGet}
      />
    );
  }

  render() {
    let content;

    let showOnboarding = !warehouse.localGet('landscape-onboarding');

    if (showOnboarding) {
      content = (
        <OnboardingPage
          localSet={warehouse.localSet}
        />
      );
    } else if (this.state.menuOpen) {
      content = (
        <CommandMenu
          api={api}
          store={warehouse.store}
          storeReports={warehouse.storeReports}
          pushCallback={warehouse.pushCallback}
        />
      )
    } else {
      content = (
       <BrowserRouter>
         <div>
          <Route exact path="/~inbox"
            render={ (props) => {
              return (
                <div>
                  {this.loadHeader()}
                  <InboxRecentPage 
                    api={api}
                    store={warehouse.store}
                    storeReports={warehouse.storeReports}
                    pushCallback={warehouse.pushCallback}
                  />
                </div>
              );
            }} />
          <Route exact path="/~inbox/all"
            render={ (props) => {
              return (
                <div>
                  {this.loadHeader()}
                  <InboxAllPage 
                    api={api}
                    store={warehouse.store}
                    storeReports={warehouse.storeReports}
                    pushCallback={warehouse.pushCallback}
                  />
                </div>
              );
            }} />
        </div>
      </BrowserRouter>
      )
    }

    return content;
  }

}
