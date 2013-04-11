var assert = require('chai').assert,
    sinon = require('sinon'),
    Response = require('../lib/response');

describe('Response', function() {
  var response, callback;

  beforeEach(function() {
    callback = sinon.spy();
    response = new Response({}, callback);
  });

  describe('.send', function() {
    it('should set response objects', function() {
      var objects = [1,2,2];

      response.send(objects);

      assert.equal(response.objects, objects);
    });

    it('should call the ack callback', function() {
      response.send();

      assert(callback.calledOnce);
    });
  });

 describe('.error', function() {
    it('should not have error by default', function() {
      assert.isFalse(response.error());
    });
  });

  describe('.success', function() {
    it('should be successful by default', function() {
      assert.isTrue(response.success());
    });
  });

  describe('.getError', function() {
    it('should return undefined when there is no error', function() {
      assert.isUndefined(response.getError());
    });
  });
});