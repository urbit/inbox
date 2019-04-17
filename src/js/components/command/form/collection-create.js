import React, { Component } from 'react';
import { CommandForm } from '/components/command/form';
import { getStationDetails } from '/services';
import { PAGE_STATUS_TRANSITIONING, REPORT_PAGE_STATUS } from '/lib/constants';
import _ from 'lodash';
import urbitOb from 'urbit-ob';

export class CommandFormCollectionCreate extends Component {
  getCollectionCreateForm() {
    return {
      fields: [{
        name: "name",
        type: "text",
        placeholder: "Collection name...",
        errorMsg: "Name can't be blank",
        validate: (value) => value !== ""
      }, {
        name: "invites",
        type: "textarea",
        placeholder: `~ship-name\n~ship-name`,
        errorMsg: "Invites must be of form ~ship-name \\n ~ship-name",
        validate: (value) => {
          if (value === "") return true;
          let tokens = value.trim().split("\n").map(t => t.trim());
          return tokens.reduce((valid, s) => valid && urbitOb.isValidPatp(s) && s.includes("~"), true);
        }
      }, {
        name: "visible",
        type: "text",
        placeholder: "'yes' or 'no'",
        errorMsg: "Visibility must be either 'yes' or 'no'",
        validate: (value) => value === "yes" || value === "no"
      }],
      submit: function() {
        this.props.storeReports([{
          type: REPORT_PAGE_STATUS,
          data: PAGE_STATUS_TRANSITIONING
        }]);

        let dat = {
          ship: this.props.api.authTokens.ship,
          desk: 'home',
          acts: [{
            collection: {
              path: '/web/collections',
              name: this.state.formData.name,
              desc: this.state.formData.name,
              visible: this.state.formData.visible === "yes",
              comments: true,
              type: "blog",
            }
          }]
        }
        this.props.api.coll(dat);
        this.props.pushCallback("circles", (rep) => {
          let station = `~${this.props.api.authTokens.ship}/${rep.data.cir}`;
          let details = getStationDetails(station);

          this.props.api.hall({
            source: {
              nom: 'inbox',
              sub: true,
              srs: [station]
            }
          });

          let inviteArray = this.state.formData.invites.trim().split("\n").map(t => t.trim().substr(1));
          api.permitCol(rep.data.cir, inviteArray, true, this.state.formData.name);

          this.props.transitionTo(details.stationUrl);
        });
      }
    }
  }

  render() {
    let form = this.getCollectionCreateForm();

    return (<CommandForm
              api={this.props.api}
              store={this.props.store}
              pushCallback={this.props.pushCallback}
              storeReports={this.props.storeReports}
              transitionTo={this.props.transitionTo}
              form={form}
              cancel={this.props.cancel}
            />);

  }
}
