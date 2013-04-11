var _ = require('underscore'),
    assert = require('chai').assert,
    sinon = require('sinon'),
    MatchRoster = require('../../lib/strategies/match_roster');

describe('MatchRoster', function() {
  var roster;

  beforeEach(function() {
    roster = new MatchRoster();
  });

  describe('.set and .get', function() {
    it('should set and get with property and string match value pairs', function() {
      roster.add('name', 'Joe', 'socket');
      assert.equal(roster.get('name', 'Joe'), 'socket');
    });

    it('should set and get with property and regex or string equivalent match value pairs', function() {
      roster.add('name', /joe/i, 'socket');

      assert(roster.get('name', /joe/i), 'socket');
      assert(roster.get('name', '/joe/i'), 'socket');
    });
  });

  describe('.forEachMatch', function() {
    var equivalentSet, callback, s1, s2, s3, s4;
    beforeEach(function() {
      equivalentSet = function(list) {
        return sinon.match(function(otherList) {
          var intersection = _.intersection(list, otherList);

          return list.length === otherList.length && intersection.length === list.length;
        }, "contains identical elements as " + list);
      };

      callback = sinon.spy();
      s1 = {id: 1};
      s2 = {id: 2};
      s3 = {id: 3};
      s4 = {id: 4};
      roster.add('group', 'a1', s1);
      roster.add('group', 'a1', s2);
      roster.add('group', 'b1', s1);
      roster.add('group', 'b2', s1);
      roster.add('group', 'b2', s3);
      roster.add('group', /1/, s4);
    });

    it('should call callback for each interested socket', function() {
      var object = {group: 'a1'};
      roster.forEachMatch([object], callback);

      assert.equal(callback.callCount, 3);
      assert(callback.calledWith(s1));
      assert(callback.calledWith(s2));
      assert(callback.calledWith(s4));
    });

    it('should call callback with matching objects', function() {
      var object1 = {group: 'b1'},
          object2 = {group: 'b2'};

      roster.forEachMatch([object1, object2], callback);

      assert.equal(callback.callCount, 3);
      assert(callback.calledWith(s1, equivalentSet([object1, object2])));
      assert(callback.calledWith(s3, equivalentSet([object2])));
      assert(callback.calledWith(s4, equivalentSet([object1])));
    });
  });

});