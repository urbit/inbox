import React, { Component } from 'react';
import { PAGE_STATUS_TRANSITIONING, STATUS_READY, STATUS_LOADING, REPORT_PAGE_STATUS } from '/lib/constants';
import { Button } from '/components/lib/button';
import { Sigil } from '/components/lib/icons/sigil';

export class CommentCreate extends Component {
  constructor(props) {
    super(props);
    this.createComment = this.createComment.bind(this);
    this.valueChange = this.valueChange.bind(this);
    this.state = {
      comment: '',
      status: STATUS_READY
    };
    let loc = window.location.pathname;

    let locList = loc.split('/').slice(1);

    if (locList[0] == '~~') {
      locList.shift();
    }

    this.pageShip = (locList[1] == '==') ?
      locList[0].slice(1) :
      `${props.api.authTokens.ship}`

    this.clayPath = loc.includes("/==/web") ?
      '/' + locList.slice(2).join('/') :
      '/web/' + locList.join('/');

  }

  createComment() {
    this.setState({ status: STATUS_LOADING });

    this.props.api.coll({
      ship: this.pageShip,
      desk: 'home',
      acts: [{
        comment: {
          path: this.clayPath,
          content: this.state.comment,
        }
      }]
    });

    this.props.storeReports([{
      type: REPORT_PAGE_STATUS,
      data: PAGE_STATUS_TRANSITIONING
    }]);

    this.props.pushCallback("circle.gram", (rep) => {
      this.setState({ comment: '', status: STATUS_READY});
      // this.props.transitionTo(this.pageShip == this.props.api.authTokens.ship ? `/~~/collections/${this.props.coll}/${this.props.top}` : `/~~/${this.pageShip}/==/web/collections/${this.props.coll}/${this.props.top}`)
      this.props.transitionTo(window.location.pathname); // any reason we shouldnt do this?
    });
  }

  valueChange(event) {
    const target = event.target;
    const name = target.name;
    const value = target.value;

    this.setState({
      [name]: value
    });
  }
  //

  render() {
    return (
      <div>
        <div className="flex align-top">
          <div className="mr-2 mt-3">
            <Sigil ship={`~${this.props.api.authTokens.ship}`} size="18" prefix="true"/>
          </div>
          <textarea
            value={this.state.comment}
            onChange={this.valueChange}
            name="comment"
            className="comment-edit mb-4"
            disabled={this.state.status === STATUS_LOADING}
            placeholder="">
          </textarea>
        </div>
        <Button
          classes="btn btn-primary collection-comment-content"
          disabled={this.state.comment.length === 0 || this.state.status === STATUS_LOADING}
          action={this.createComment}
          responseKey="circle.gram"
          pushCallback={this.props.pushCallback}
          content="Add comment" />
      </div>
    )
  }
}
