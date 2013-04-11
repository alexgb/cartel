var assert = require('chai').assert,
    Request = require('../lib/request');


describe('Request', function() {
  it('should require an action header', function() {
    assert.throw(function() {
      new Request({headers: {}});
    });
  });
});