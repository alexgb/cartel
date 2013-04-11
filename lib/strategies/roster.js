var _ = require('underscore');


module.exports = Roster;

/**
 * Roster
 * 
 * A simple store meant to keep lists of sockets for use by
 * push strategies.
 */

function Roster() {
  this.data = {};
}

/**
 * Add a value to the list for a key.
 *
 * @param {String} key
 * @param {Object} value
 * @api public
 */

Roster.prototype.add = function(key, value) {
  this.data[key] = this.data[key] || [];
  if (this.data[key].indexOf(value) === -1) {
    this.data[key].push(value);
  }
};

/**
 * Get the list of values for a key.
 *
 * @param {String} key
 * @return {Array}
 * @api public
 */

Roster.prototype.get = function(key) {
  return _.clone(this.data[key] || []);
};

/**
 * Remove all values for a key.
 *
 * @param {String} key
 * @api public
 */

Roster.prototype.destroyKey = function(key) {
  this.data[key] = undefined;
};

/**
 * Remove a single value from a key.
 *
 * @param {String} key
 * @param {String} value
 * @api public
 */

Roster.prototype.remove = function(key, value) {
  var values = this.data[key],
      index;

  if (values) {
    index = values.indexOf(value);
    if (~index) values.splice(index, 1);
  }
};

/**
 * Remove a value from all keys.
 *
 * @param {Object} value
 * @api public
 */

Roster.prototype.removeFromAll = function(value) {
  var keys = Object.keys(this.data);

  for (var i = keys.length - 1; i >= 0; i--) {
    this.remove(keys[i], value);
  }
};
