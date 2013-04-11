var assert = require('chai').assert,
    Roster = require('../../lib/strategies/roster');

describe('Roster', function() {
  var roster;

  beforeEach(function() {
    roster = new Roster();
  });

  describe('.add and .get', function() {

    it('should be able to add and get key, value', function() {
      roster.add('foo', 'bar');

      var results = roster.get('foo');

      assert.lengthOf(results, 1);
      assert.include(results, 'bar');
    });

    it('should return unique values per key', function() {
      roster.add('foo', 'bar');
      roster.add('foo', 'fig');
      roster.add('foo', 'bar');

      var results = roster.get('foo');

      assert.lengthOf(results, 2);
      assert.include(results, 'bar');
      assert.include(results, 'fig');
    });

    it('should return an empty array for keys with no values', function() {
      var results = roster.get('mud');

      assert.isArray(results);
      assert.lengthOf(results, 0);
    });

    it('should return an empty array for undefined key', function() {
      var results = roster.get(undefined);

      assert.isArray(results);
      assert.lengthOf(results, 0);
    });

    it('should return a mutable array, not an internal reference', function() {
      roster.add('foo', 'fig');
      roster.add('foo', 'bar');

      roster.get('foo').pop();
      var results = roster.get('foo');

      assert.lengthOf(results, 2);
    });

  });

  describe('non empty set', function() {
    beforeEach(function() {
      roster.add('basket', 'tomato');
      roster.add('basket', 'celery');
      roster.add('satchel', 'wine');
      roster.add('satchel', 'tomato');
    });

    describe('.remove', function() {
      it('should remove values from key', function() {
        roster.remove('basket', 'celery');
        roster.remove('basket', 'cheese');

        var results = roster.get('basket');

        assert.lengthOf(results, 1);
        assert.equal(results[0], 'tomato');
      });
    });

    describe('.destroyKey', function() {
      it('should remove all values for key', function() {
        roster.destroyKey('basket');

        var results = roster.get('basket');

        assert.isArray(results);
        assert.lengthOf(results, 0);
      });
    });

    describe('.removeFromAll', function() {
      it('should remove value from all keys', function() {
        roster.removeFromAll('tomato');

        var basket = roster.get('basket');
        var satchel = roster.get('satchel');


        assert.equal(basket.indexOf('tomato'), -1);
        assert.equal(satchel.indexOf('tomato'), -1);
      });
    });
  });

});