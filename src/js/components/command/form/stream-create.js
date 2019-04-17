import React, { Component } from 'react';
import { CommandForm } from '/components/command/form';
import { isPatTa } from '/lib/util';
import { getStationDetails } from '/services';
import { PAGE_STATUS_TRANSITIONING, REPORT_PAGE_STATUS } from '/lib/constants';
import urbitOb from 'urbit-ob';
import _ from 'lodash';

export class CommandFormStreamCreate extends Component {
  getStreamCreateForm() {
    return {
      fields: [{
        name: "name",
        type: "text",
        placeholder: "friendclub",
        errorMsg: "Must be a @ta (a-z, 0-9, . _ - ~)",
        validate: (value) => {
          return isPatTa(value);
        }
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

        this.props.api.hall({
          create: {
            nom: this.state.formData.name,
            des: "chatroom",
            sec: "channel"
          }
        });

        this.props.pushCallback("circles", rep => {
          if (!rep.data.cir) return false;

          let station = `~${this.props.api.authTokens.ship}/${rep.data.cir}`;
          let details = getStationDetails(station);

          this.props.api.hall({
            source: {
              nom: 'inbox',
              sub: true,
              srs: [station]
            }
          });

          if (this.state.formData.invites.length > 0) {
            let inviteArray = this.state.formData.invites.trim().split("\n").map(t => t.trim().substr(1));
            api.permit(rep.data.cir, inviteArray, true);
            //
            // let audInboxes = inviteArray.map((aud) => `${aud}/i`);
            // let inviteMessage = {
            //   aud: audInboxes,
            //   ses: [{
            //     inv: {
            //       inv: true,
            //       cir: station
            //     }
            //   }]
            // };
            //
            // this.props.api.hall({
            //   phrase: inviteMessage
            // });
          }

          this.props.transitionTo(details.stationUrl);
        });
      }
    }
  }

  render() {
    let form = this.getStreamCreateForm();

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
