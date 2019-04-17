import { api } from '/api';
import _ from 'lodash';
import Mousetrap from 'mousetrap';
import { warehouse } from '/warehouse';
import { isDMStation, getMessageContent } from '/lib/util';
import { getStationDetails, pruneMessages } from '/services';
import { REPORT_PAGE_STATUS, PAGE_STATUS_DISCONNECTED, PAGE_STATUS_PROCESSING, PAGE_STATUS_READY, INBOX_MESSAGE_COUNT } from '/lib/constants';
import urbitOb from 'urbit-ob';

const LONGPOLL_TIMEOUT = 15000;
const LONGPOLL_TRYAGAIN = 30000;

/**
  Response format

  {
    data: {
      json: {
        circle: {   // *.loc for local, *.rem for remote
          cos:      // config
          pes:      // presence
          nes:      // messages
          gram:     // message (individual)
        }
        circles:    // circles you own
        public:     // circles in your public membership list
        client: {
          gys:      // glyphs
          nis:      // nicknames
        }
        peers:      // subscribers to your circles
        status:     // rumor, presence -- TODO?
      }
    }
    from: {
      path:    // Subscription path that triggered response
      ship:    // Subscription requestor
    }
  }
**/

export class UrbitOperator {
  constructor() {
    this.seqn = 1;
    this.disconnectTimer = null;
  }

  start() {
    if (api.authTokens) {
      this.initializeLandscape();
      this.bindShortcuts();
      this.setCleanupTasks();
      this.refreshPoll();
    } else {
      console.error("~~~ ERROR: Must set api.authTokens before operation ~~~");
    }
  }

  setCleanupTasks() {
    window.addEventListener("beforeunload", e => {
      api.bindPaths.forEach(p => {
        this.wipeSubscription(p);
      });
    });
  }

  wipeSubscription(path) {
    api.hall({
      wipe: {
        sub: [{
          hos: api.authTokens.ship,
          pax: path
        }]
      }
    });
  }

  bindShortcuts() {
    Mousetrap.bind(["mod+k"], () => {
      warehouse.storeReports([{
        type: "menu.toggle"
      }]);

      return false;
    });
  }

  initializeLocalStorage() {
    warehouse.pushCallback('landscape.prize', rep => {
      let uids = Object.values(rep.data.dms).flatMap(m => m.messages).map(m => m.gam.uid);

      if (!warehouse.localGet('dms-seen')) {
        warehouse.localSet('dms-seen', uids);
      }
    });
  }

  notifyDMs(msgs) {
    let prunedMsgs = pruneMessages(msgs);
    let seenDms = warehouse.localGet('dms-seen');

    let newDms = prunedMsgs
                  .filter(m => {
                    let isDm = m.stationDetails.type === "stream-dm";
                    let fromOther = m.aud !== api.authTokens.ship;
                    let unseen = !seenDms.includes(m.uid);

                    return isDm && fromOther && unseen;
                  });

    if (newDms.length > 0) {
      warehouse.storeReports([{
        type: 'dm.new',
        data: newDms
      }]);
    }

    return false;
  }

  initializeLandscape() {
    this.initializeLocalStorage();

    api.bind(`/primary`, "PUT", api.authTokens.ship, 'collections');

    warehouse.pushCallback(['circle.gram', 'circle.nes', 'landscape.prize'], (rep) => {
      let msgs = [];

      switch (rep.type) {
        case "circle.gram":
          msgs = [rep.data];
          break;
        case "circle.nes":
          msgs = rep.data;
          break;
        case "landscape.prize":
          msgs = rep.data.inbox.messages;
          break;
      }

      this.notifyDMs(msgs);

      return false;
    });

    warehouse.pushCallback('landscape.prize', (rep) => {
      warehouse.storeReports([{
        type: REPORT_PAGE_STATUS,
        data: PAGE_STATUS_READY
      }]);
    });


    // warehouse.pushCallback(REPORT_PAGE_STATUS, (rep) => {
    //   if (rep.data === PAGE_STATUS_PROCESSING) {
    //     setTimeout(() => {
    //       warehouse.storeReports([{
    //         type: REPORT_PAGE_STATUS,
    //         data: PAGE_STATUS_READY
    //       }]);
    //     }, 3000)
    //   }
    // });

    // api.bind(`/circle/inbox/grams/-${INBOX_MESSAGE_COUNT}`, "PUT");

    // warehouse.pushCallback(['dm.new'], (rep) => {
    //
    // });


      // let circle = rep.from.path.split('/')[2];

      // do nothing with gram binds to foreign ships
      // if (urbitOb.isValidPatp(circle)) return;

      // Any message comes in to the /i circle


    // first step: bind to author's circles
    // api.bind(`/circles/~${api.authTokens.ship}`, "PUT");
    //
    // warehouse.pushCallback('circles', rep => {
    //   // inbox local + remote configs, remote presences
    //   api.bind("/circle/inbox/config/group-r", "PUT");
    //
    //   // inbox messages
    //   api.bind(`/circle/inbox/grams/-${INBOX_MESSAGE_COUNT}`, "PUT");
    //
    //   // bind to invite circle (shouldn't be subscribed to inbox)
    //   api.bind("/circle/i/grams/-999", "PUT");
    //
    //   warehouse.pushCallback(['circle.gram', 'circle.nes'], (rep) => {
    //     let circle = rep.from.path.split('/')[2];
    //
    //     // do nothing with gram binds to foreign ships
    //     if (urbitOb.isValidPatp(circle)) return;
    //
    //     // Any message comes in to the /i circle
    //     if (circle === "i") {
    //       let msgs = rep.type === "circle.gram" ? [rep.data.gam] : rep.data.map(m => m.gam);
    //       this.quietlyAcceptDmInvites(msgs);
    //     }
    //
    //     let lastReadNum;
    //     if (_.isArray(rep.data) && rep.data.length > 0) {
    //       lastReadNum = _.nth(rep.data, -1).num;
    //     } else {
    //       lastReadNum = rep.data.num;
    //     }
    //
    //     if (lastReadNum && warehouse.store.configs[`~${api.authTokens.ship}/${circle}`].lastReadNum < lastReadNum) {
    //       api.hall({
    //         read: {
    //           nom: circle,
    //           red: lastReadNum
    //         }
    //       });
    //
    //       warehouse.storeReports([{
    //         type: "circle.read",
    //         data: {
    //           station: `~${api.authTokens.ship}/${circle}`,
    //           lastReadNum
    //         }
    //       }])
    //     }
    //
    //     return false;
    //   })
    //
    //   warehouse.pushCallback('circle.nes', (rep) => {
    //     // First batch of inbox messages has gotten in
    //
    //     if (rep.from.path.includes("inbox")) {
    //       this.eagerFetchExtConfs();
    //       warehouse.storeReports([{
    //         type: REPORT_PAGE_STATUS,
    //         data: PAGE_STATUS_READY
    //       }]);
    //       return false;
    //     }
    //   });
    //
    //   warehouse.pushCallback('circle.cos.loc', (rep) => {
    //     let fromCircle = rep.from && rep.from.path.split("/")[2];
    //     let fromInbox = fromCircle === "inbox";
    //
    //     // this.wipeSubscription('/circle/inbox/config/group-r/0');
    //
    //     if (fromInbox) {
    //       warehouse.storeReports([{
    //         type: "inbox.sources-loaded",
    //       }]);
    //     }
    //
    //     return false;
    //   });
    //
    //   return true;
    // });

    // grab the config for the root collection circle
    // api.bind("/circle/c/config/group-r/0", "PUT");

    // parses client-specific info (ship nicknames, glyphs, etc)
    // this.bind("/client", "PUT");

    // public membership
    // api.bind("/public", "PUT");

    // bind to collections
    // this.bind("/", "PUT", "collections");

    // delete subscriptions when you're done with them, like...
    // this.bind("/circle/inbox/grams/0", "DELETE");
  }

  refreshPoll() {
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);

    this.disconnectTimer = setTimeout(() => {
      warehouse.storeReports([{
        type: REPORT_PAGE_STATUS,
        data: PAGE_STATUS_DISCONNECTED
      }]);
    }, LONGPOLL_TIMEOUT);

    if (warehouse.store.views.transition === PAGE_STATUS_DISCONNECTED) {
      warehouse.storeReports([{
        type: REPORT_PAGE_STATUS,
        data: PAGE_STATUS_READY
      }]);
    }

    this.runPoll();
  }

  runPoll() {
    console.log('fetching... ', this.seqn);

    // const controller = new AbortController();
    // const signal = controller.signal;

    // const disconnectedTimeout = setTimeout(() => {
    //   controller.abort();
    //   warehouse.storeReports([{
    //     type: REPORT_PAGE_STATUS,
    //     data: PAGE_STATUS_DISCONNECTED
    //   }]);
    //   this.runPoll();
    // }, LONGPOLL_TIMEOUT);

    fetch(`/~/of/${api.authTokens.ixor}?poll=${this.seqn}`, {
      credentials: "same-origin",
      // signal: controller.signal
    })
      .then(res => {
        return res.json();
      })
      .then(data => {
        if (data.beat) {
          console.log('beat');
          this.refreshPoll();
        } else {
          console.log("new server data: ", data);

          if (data.data) {
            warehouse.storePollResponse(data);
          }

          this.seqn++;
          this.refreshPoll();
        }
      })
      .catch(error => {
        console.error('error = ', error);
        setTimeout(() => {
          this.runPoll();
        }, LONGPOLL_TRYAGAIN);
      });
  }
}

export let operator = new UrbitOperator();
window.operator = operator;
