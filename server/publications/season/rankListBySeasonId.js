import { Meteor } from 'meteor/meteor';

import { dbRankCompanyPrice } from '/db/dbRankCompanyPrice';
import { dbRankCompanyProfit } from '/db/dbRankCompanyProfit';
import { dbRankCompanyValue } from '/db/dbRankCompanyValue';
import { dbRankUserWealth } from '/db/dbRankUserWealth';
import { limitSubscription } from '/server/imports/rateLimit';
import { debug } from '/server/imports/debug';

Meteor.publish('rankListBySeasonId', function(seasonId) {
  debug.log('publish rankListBySeasonId', seasonId);

  dbRankCompanyPrice.find({seasonId}).forEach((doc) => {
    this.added('rankCompanyPrice', doc._id, doc);
  });
  dbRankCompanyProfit.find({seasonId}).forEach((doc) => {
    this.added('rankCompanyProfit', doc._id, doc);
  });
  dbRankCompanyValue.find({seasonId}).forEach((doc) => {
    this.added('rankCompanyValue', doc._id, doc);
  });
  dbRankUserWealth.find({seasonId}).forEach((doc) => {
    this.added('rankUserWealth', doc._id, doc);
  });
  this.ready();
});
//一分鐘最多重複訂閱30次
limitSubscription('rankListBySeasonId', 30);
