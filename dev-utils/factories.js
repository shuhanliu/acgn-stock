import { Factory } from 'rosie';
import faker from 'faker';

import { productTypeList } from '/db/dbProducts';

export const pttUserFactory = new Factory()
  .sequence('username', (n) => {
    return `user${n}`;
  })
  .attr('password', ['username'], (username) => {
    return username;
  })
  .attr('profile', ['username'], (username) => {
    return {
      validateType: 'PTT',
      name: username
    };
  });

export const companyFactory = new Factory()
  .attrs({
    companyName() {
      return faker.company.companyName();
    },
    manager: '!none',
    chairman: '!none',
    description() {
      return faker.lorem.paragraph();
    },
    tags() {
      return faker.lorem.words(10).split(' ');
    },
    totalRelease: 1000,
    lastPrice: 128,
    listPrice: 128,
    profit: 0,
    candidateList: [],
    voteList: [],
    createdAt() {
      return new Date();
    }
  })
  .attr('totalValue', ['totalRelease', 'listPrice'], (totalRelease, listPrice) => {
    return totalRelease * listPrice;
  });

export const foundationFactory = new Factory()
  .attrs({
    companyName() {
      return faker.company.companyName();
    },
    manager: '!none',
    description() {
      return faker.lorem.paragraph();
    },
    tags() {
      return faker.lorem.words(10).split(' ');
    },
    createdAt() {
      return new Date();
    }
  });

export const productFactory = new Factory()
  .attrs({
    productName() {
      return faker.lorem.sentence();
    },
    type() {
      return faker.random.arrayElement(productTypeList);
    },
    url() {
      return faker.internet.url();
    },
    description() {
      return faker.lorem.sentence(20);
    },
    createdAt() {
      return new Date();
    }
  });

export const taxFactory = new Factory()
  .attrs({
    tax() {
      return faker.random.number({ min: 1 });
    },
    zombie() {
      return faker.random.number({ min: 1 });
    },
    fine: 0,
    paid: 0,
    expireDate() {
      return faker.date.future(0.1);
    }
  });
