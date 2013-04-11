
/**
 * Iterate over an array or array like object
 *
 * @param {Array} array or array like object
 * @param {Function} iterator
 * @param {Object} context, optional
 * @api private
 */

module.exports.each = function(obj, iterator, context) {
  if (obj.forEach) {
    obj.forEach(iterator, context);
  } else {
    for (var i = obj.length - 1; i >= 0; i--) {
      fn.call(context, obj[i], i, obj);
    }
  }
};

/**
 * Merge any number of objects onto the first object passed.
 *
 * @param {*} any number of objects
 * @api private
 */

module.exports.merge = function(obj) {
  module.exports.each(Array.prototype.slice.call(arguments, 1), function(source) {
    if (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
};

/**
 * Find index of search element in list. Will fallback to shim when
 * not available.
 *
 * @param {Array|*} list
 * @param {*} searchElement
 * @param {Number} startIndex
 * @return {Number}
 * @api private
 */

module.exports.indexOf = function(list, searchElement, startIndex) {
  return (Array.prototype.indexOf || indexOfShim).call(list, searchElement, startIndex);
};

// Based on https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
function indexOfShim(searchElement) {
  "use strict";
  if (this == null) {
    throw new TypeError();
  }
  var t = Object(this);
  var len = t.length >>> 0;
  if (len === 0) {
    return -1;
  }
  var n = 0;
  if (arguments.length > 1) {
    n = Number(arguments[1]);
    if (n != n) { // shortcut for verifying if it's NaN
      n = 0;
    } else if (n != 0 && n != Infinity && n != -Infinity) {
      n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
  }
  if (n >= len) {
    return -1;
  }
  var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
  for (; k < len; k++) {
    if (k in t && t[k] === searchElement) {
        return k;
    }
  }
  return -1;
}
