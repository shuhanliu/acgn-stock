import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { limitSubscription } from '/server/imports/rateLimit';
import { dbLog, importantAccuseLogTypeList } from '/db/dbLog';
import { debug } from '/server/imports/debug';

Meteor.publish('lastImportantAccuseLogDate', function() {
  debug.log('publish lastImportantAccuseLogDate');

  const userId = this.userId;
  check(userId, String);

  this.added('variables', 'lastImportantAccuseLogDate', { value: null });
  const observer = dbLog.find({
    logType: { $in: importantAccuseLogTypeList },
    userId,
    'userId.0': { $ne: userId }
  }, {
    sort: { createdAt: -1 },
    limit: 1
  }).observeChanges({
    added: (id, fields) => {
      this.changed('variables', 'lastImportantAccuseLogDate', { value: fields.createdAt });
    }
  });
  this.ready();
  this.onStop(() => {
    observer.stop();
  });
});
//一分鐘最多20次
limitSubscription('lastImportantAccuseLogDate');
