var assert = require('chai').assert,
    sinon = require('sinon'),
    util = require('../lib/util');

describe('util', function() {

  describe('.each', function() {
    var iterator;

    beforeEach(function() {
      iterator = sinon.spy();
    });

    it('should iterate over array values', function() {
      util.each(['a', 'b', 'c'], iterator);

      assert.equal(iterator.callCount, 3);
      assert.equal(iterator.args[0][0], 'a');
      assert.equal(iterator.args[1][0], 'b');
      assert.equal(iterator.args[2][0], 'c');
    });

    it('should use context for iteration', function() {
      var context = {};

      util.each(['a', 'b', 'c'], iterator, context);

      assert.equal(iterator.callCount, 3);
      assert(iterator.calledOn(context));
    });
  });

  describe('.merge', function() {
    it('should merge source object onto destination', function() {
      var destination = {a: 'apples', b: 'broccoli'};

      util.merge(destination, {b: 'bananas'});

      assert.equal(destination.a, 'apples');
      assert.equal(destination.b, 'bananas');
    });

    it('should merge multiple source objects onto destination', function() {
      var destination = {a: 'apples', b: 'broccoli'};

      util.merge(destination, {b: 'bananas'}, {a: 'avacados', c: 'carrots'});

      assert.equal(destination.a, 'avacados');
      assert.equal(destination.b, 'bananas');
      assert.equal(destination.c, 'carrots');
    });
  });

});