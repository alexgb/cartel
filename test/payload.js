var assert = require('chai').assert,
    Payload = require('../lib/payload');

describe('Payload', function() {
  var payload;

  describe('with empty message', function() {
    beforeEach(function() {
      payload = new Payload();
    });

    it('should have headers', function() {
      assert.isObject(payload.headers);
    });

    it('should have empty objects array', function() {
      assert.isArray(payload.objects);
    });

    describe('.setHeader', function() {
      it('should set its headers', function() {
        payload.setHeader('foo', 'bar');
        assert.equal(payload.headers.foo, 'bar');
      });
    });

    describe('.setError', function() {
      it('should set headers with code and message', function() {
        payload.setError(500, 'Winter is coming');
        assert.equal(payload.headers.status, 500);
        assert.equal(payload.headers.message, 'Winter is coming');
      });
    });

    describe('.error', function() {
      it('should have an error when status code is not 2xx', function() {
        payload.setHeader('status', 500);
        assert.isTrue(payload.error());
      });
    });

    describe('.success', function() {
      it('should not be successful when code is not 2xx', function() {
        payload.setHeader('status', 500);
        assert.isFalse(payload.success());
      });
    });

    describe('.getError', function() {
      it('should return an array with code and message', function() {
        payload.setHeader('status', 500);
        payload.setHeader('message', 'Bad stuff');

        var error = payload.getError();
        assert.isArray(error);
        assert.equal(error[0], 500);
        assert.equal(error[1], 'Bad stuff');
      });
    });

    describe('.getAction', function() {
      it('should return the payload action', function() {
        payload.setHeader('action', 'read');
        assert.equal(payload.getAction(), 'read');
      });
    });

    describe('.getParams', function() {
      it('should return an empty object by default', function() {
        assert.isObject(payload.getParams());
      });

      it('should return params stored in meta', function() {
        payload.meta = {params: {title: 'Sinbad'}};
        assert.equal(payload.getParams().title, 'Sinbad');
      });
    });

  });


  describe('instantiating with message data', function() {
    beforeEach(function() {
      payload = new Payload({
        headers: {
          action: 'create'
        },
        objects: [{id: 1, title: '1'}, {id: 2, title: '2'}]
      });
    });

    it('should have configured headers', function() {
      assert.equal(payload.headers.action, 'create');
    });

    it('should have configured objects', function() {
      assert.isArray(payload.objects);
      assert.lengthOf(payload.objects, 2);
      assert.equal(payload.objects[0].id, 1);
    });

    describe('.toJSON', function() {
      it('should only JSON encode message parts', function() {
        payload.otherAttr = 'foo';

        assert.property(payload.toJSON(), 'headers');
        assert.property(payload.toJSON(), 'objects');
        assert.property(payload.toJSON(), 'meta');
        assert.notProperty(payload.toJSON(), 'otherAttr');
      });
    });
  });

});