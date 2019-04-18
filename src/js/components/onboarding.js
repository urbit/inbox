import React, { Component } from 'react';
import classnames from 'classnames';

export class OnboardingPage extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="container header-container">
          <div className="row">
            <div className="flex-col-2"></div>
            <div className="flex-col-x header-breadcrumbs"></div>
          </div>
          <div className="row align-center header-mainrow">
            <h1 className="flex-offset-2 flex-col-x header-title">Welcome</h1>
          </div>
          <div className="row header-carpet">
          </div>
        </div>

        <div className="container">
          <div className="row">
            <div className="flex-offset-2 flex-col-6">
              <p className="mb-5">This is Landscape, an agent for creating cities on top of Arvo.</p>
              <p className="mb-5">Currently, we’re running a few experimental cities that are invite-only. If you’re running a planet or a star and would like to join, you’ll need to request access.</p>
              <p className="mb-5">Our cities are limited in size and limited to planets or above. To request access, send an email to <span className="text-mono">support@urbit.org</span></p>
              <p className="mb-7">In the meantime, check out the <a href="https://urbit.org/docs">docs</a> and start exploring.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => {
                  this.props.localSet('landscape-onboarding', true);
                  this.forceUpdate();
                }}>
                Okay!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
