import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { resourceManager } from '/server/imports/resourceManager';
import { dbCompanies } from '/db/dbCompanies';
import { dbOrders } from '/db/dbOrders';
import { dbVariables } from '/db/dbVariables';
import { limitMethod } from '/server/imports/rateLimit';
import { createOrder } from '/server/imports/createOrder';
import { debug } from '/server/imports/debug';

Meteor.methods({
  createBuyOrder(orderData) {
    check(this.userId, String);
    check(orderData, {
      companyId: String,
      unitPrice: Match.Integer,
      amount: Match.Integer
    });
    createBuyOrder(Meteor.user(), orderData);

    return true;
  }
});
export function createBuyOrder(user, orderData) {
  debug.log('createBuyOrder', {user, orderData});
  if (user.profile.notPayTax) {
    throw new Meteor.Error(403, '您現在有稅單逾期未繳！');
  }
  if (_.contains(user.profile.ban, 'deal')) {
    throw new Meteor.Error(403, '您現在被金融管理會禁止了所有投資下單行為！');
  }
  if (orderData.unitPrice < 1) {
    throw new Meteor.Error(403, '購買單價不可小於1！');
  }
  if (orderData.amount < 1) {
    throw new Meteor.Error(403, '購買數量不可小於1！');
  }
  const totalCost = orderData.unitPrice * orderData.amount;
  if (user.profile.money < totalCost) {
    throw new Meteor.Error(403, '剩餘金錢不足，訂單無法成立！');
  }
  const companyId = orderData.companyId;
  const userId = user._id;
  const existsSellOrderCursor = dbOrders.find({
    companyId: companyId,
    userId: userId,
    orderType: '賣出'
  });
  if (existsSellOrderCursor.count() > 0) {
    throw new Meteor.Error(403, '有賣出該公司股票的訂單正在執行中，無法同時下達購買的訂單！');
  }
  const companyData = dbCompanies.findOne(companyId, {
    fields: {
      _id: 1,
      companyName: 1,
      listPrice: 1,
      lastPrice: 1,
      isSeal: 1
    }
  });
  if (! companyData) {
    throw new Meteor.Error(404, '不存在的公司股票，訂單無法成立！');
  }
  if (companyData.isSeal) {
    throw new Meteor.Error(403, '「' + companyData.companyName + '」公司已被金融管理委員會查封關停了！');
  }
  if (orderData.unitPrice < Math.max(Math.floor(companyData.listPrice * 0.85), 1)) {
    throw new Meteor.Error(403, '每股單價不可偏離該股票參考價格的百分之十五！');
  }
  if (companyData.listPrice < dbVariables.get('lowPriceThreshold')) {
    if (orderData.unitPrice > Math.ceil(companyData.listPrice * 1.3)) {
      throw new Meteor.Error(403, '每股單價不可高於該股票參考價格的百分之三十！');
    }
  }
  else if (orderData.unitPrice > Math.max(Math.ceil(companyData.listPrice * 1.15), 1)) {
    throw new Meteor.Error(403, '每股單價不可偏離該股票參考價格的百分之十五！');
  }
  resourceManager.throwErrorIsResourceIsLock(['season', 'companyOrder' + companyId, 'user' + userId]);
  //先鎖定資源，再重新讀取一次資料進行運算
  resourceManager.request('createBuyOrder', ['companyOrder' + companyId, 'user' + userId], (release) => {
    const user = Meteor.users.findOne(userId, {
      fields: {
        profile: 1
      }
    });
    const totalCost = orderData.unitPrice * orderData.amount;
    if (user.profile.money < totalCost) {
      throw new Meteor.Error(403, '剩餘金錢不足，訂單無法成立！');
    }
    const existsSellOrderCursor = dbOrders.find({
      companyId: companyId,
      userId: userId,
      orderType: '賣出'
    });
    if (existsSellOrderCursor.count() > 0) {
      throw new Meteor.Error(403, '有賣出該公司股票的訂單正在執行中，無法同時下達購買的訂單！');
    }
    const companyData = dbCompanies.findOne(companyId, {
      fields: {
        _id: 1,
        listPrice: 1,
        lastPrice: 1
      }
    });
    if (! companyData) {
      throw new Meteor.Error(404, '不存在的公司股票，訂單無法成立！');
    }
    if (orderData.unitPrice < Math.max(Math.floor(companyData.listPrice * 0.85), 1)) {
      throw new Meteor.Error(403, '每股單價不可偏離該股票參考價格的百分之十五！');
    }
    if (companyData.listPrice < dbVariables.get('lowPriceThreshold')) {
      if (orderData.unitPrice > Math.ceil(companyData.listPrice * 1.3)) {
        throw new Meteor.Error(403, '每股單價不可高於該股票參考價格的百分之三十！');
      }
    }
    else if (orderData.unitPrice > Math.max(Math.ceil(companyData.listPrice * 1.15), 1)) {
      throw new Meteor.Error(403, '每股單價不可偏離該股票參考價格的百分之十五！');
    }
    createOrder({
      userId: userId,
      companyId: companyId,
      orderType: '購入',
      unitPrice: orderData.unitPrice,
      amount: orderData.amount
    });
    release();
  });
}
//兩秒鐘最多一次
limitMethod('createBuyOrder', 1, 2000);
