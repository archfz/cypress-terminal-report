import {expect} from 'chai';

describe('Always red test', function () {
  before(function () {
    expect(1).to.eq(1);
    console.log('before');
  });
  beforeEach(function () {
    expect(1).to.eq(1);
    console.log('before e');
  });
  it('passed it', function () {
    expect(1).to.eq(1);
    console.log('it ');
  });
  it('passed it 2', function () {
    expect(1).to.eq(1);
    console.log('it 2');
  });
  afterEach(function () {
    expect(1).to.eq(1);
    console.log('after e');
  });
  after(function () {
    expect(1).to.eq(1);
    console.log('after');
  });
  after(function () {
    expect(1).to.eq(1);
    console.log('after');
  });
});
