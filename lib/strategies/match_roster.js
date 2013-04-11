var _ = require('underscore'),
    util = require('util'),
    ObjectRoster = require('./roster');

module.exports = MatchRoster;


/**
 * The MatchRoster is a roster of object match conditions and sockets.
 * Each match condition is a roster key and is comprosed of an object property
 * and match value. Match values can be a String or Number, which match using
 * '===', or a regex specified either as a string of the form '/foo/i' or a 
 * native RegExp instance.
 */

function MatchRoster() {
  ObjectRoster.call(this);
}

util.inherits(MatchRoster, ObjectRoster);

/** 
 * Override #add, #get, #destroyKey, and #remove to accept two arguments
 * for key value: property and matchValue.
 *
 * Example:
 *
 *    roster.add('name', /joe/i, socket)
 *
 */

['add', 'get', 'destroyKey', 'remove'].forEach(function(method) {
  MatchRoster.prototype[method] = function(property, matchValue /*, ... */) {
    var args = Array.prototype.slice.call(arguments, 0),
        key = encodeKey.apply(null, args.splice(0,2));

    args.unshift(key);
    return MatchRoster.super_.prototype[method].apply(this, args);
  };
});

/**
 * Override removeFromAll.
 *
 * @param {Object} value
 * @api public
 */

MatchRoster.prototype.removeFromAll = function(value) {
  var keys = Object.keys(this.data);

  for (var i = keys.length - 1; i >= 0; i--) {
    MatchRoster.super_.prototype.remove.call(this, keys[i], value);
  }
};

/**
 * Will call callback once for each socket that has any matching
 * objects from roster based on passed objects parameter. 
 * Callback called with socket and array of objects.
 *
 * Example:
 *
 *    roster.forEachMatch([{group: '1'}], function(socket, objects) {
 *      
 *    });
 *
 * @param {Array} objects
 * @param {Function} callback
 * @api public
 */
MatchRoster.prototype.forEachMatch = function(objects, callback) {
  var sockets = [],
      socketMap = {},
      keys = Object.keys(this.data),
      matcher, i, j, k, didMatch, matchedSockets, socket;

  // for each matcher
  for (i = keys.length - 1; i >= 0; i--) {
    matcher = decodeKey(keys[i]);

    // for each object
    for (j = objects.length - 1; j >= 0; j--) {

      // test matching
      if (matcher[1] instanceof RegExp) {
        didMatch = matcher[1].test(objects[j][matcher[0]]);
      }
      else {
        didMatch = matcher[1] === objects[j][matcher[0]];
      }

      // if match remmeber sockets and object
      if (didMatch && (matchedSockets = MatchRoster.super_.prototype.get.call(this, keys[i]))) {
        sockets = sockets.concat(matchedSockets);
        
        for (k = matchedSockets.length - 1; k >= 0; k--) {
          socket = matchedSockets[k];
          socketMap[socket.id] = socketMap[socket.id] || [];
          socketMap[socket.id].push(objects[j]);
        }
      }
    }
  }

  sockets = _.uniq(sockets);
  for (i = sockets.length - 1; i >= 0; i--) {
    callback(sockets[i], socketMap[sockets[i].id]);
  }
};

/**
 * Enocde a property name and matcher as a string to
 * be used as a roster key.
 *
 * @param {String} propertyName
 * @param {String|RegExp} matcher
 * @return {String}
 * @api private
 */

function encodeKey(propertyName, matchValue) {
  var matchPart;

  if (matchValue instanceof RegExp) {
    matchValue = matchValue.toString();
  }

  propertyName = escape(propertyName);
  matchValue = escape(matchValue);

  return propertyName + ":" + matchValue;
}

/**
 * Decode a roster key to a property and match pair.
 *
 * @param {String} key
 * @return {Array}
 * @api private
 */

function decodeKey(key) {
  var regexMatch,
      parts = key.split(":").map(function(part) {
        return unescape(part);
      });

  // If matcher appears to be RegExp then we instantiate it
  if (regexMatch = /^\/(.*)\/([igm]?)$/.exec(parts[1])) {
    parts[1] = new RegExp(regexMatch[1], regexMatch[2]);
  }
  return parts;
}
