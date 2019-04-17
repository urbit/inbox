import "/lib/object-extensions";
import { api } from '/api';
import { warehouse } from '/warehouse';
import { router } from '/router';
import { operator } from "/operator";
import * as util from '/lib/util';
import _ from 'lodash';

console.log('app running');

/*
  Common variables:

  station :    ~zod/club
  circle  :    club
  host    :    zod
*/

fetch('/~/auth.json',{credentials: "same-origin"}).then((res) => {
  return res.json();
})
.then((authTokens) => {
  api.setAuthTokens(authTokens);

  router.start();
  operator.start();
});

window.util = util;
window._ = _;
