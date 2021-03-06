import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { limitSubscription } from '/server/imports/rateLimit';
import { publishTotalCount } from '/server/imports/publishTotalCount';
import { dbTaxes } from '/db/dbTaxes';
import { debug } from '/server/imports/debug';

Meteor.publish('accountInfoTax', function(userId, offset) {
  debug.log('publish accountInfoTax', {userId, offset});
  check(userId, String);
  check(offset, Match.Integer);

  const filter = { userId };

  const totalCountObserver = publishTotalCount('totalCountOfAccountInfoTax', dbTaxes.find(filter), this);

  const pageObserver = dbTaxes
    .find(filter, {
      skip: offset,
      limit: 10,
      disableOplog: true
    })
    .observeChanges({
      added: (id, fields) => {
        this.added('taxes', id, fields);
      },
      changed: (id, fields) => {
        this.changed('taxes', id, fields);
      },
      removed: (id) => {
        this.removed('taxes', id);
      }
    });

  this.ready();
  this.onStop(() => {
    totalCountObserver.stop();
    pageObserver.stop();
  });
});
//一分鐘最多20次
limitSubscription('accountInfoTax');
