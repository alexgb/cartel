
module.exports = Client = {};

/**
 * Connect the client's socket.
 *
 * @api public
 */

Client.connect = function(url, options) {
  var namespace;

  url = url || (window.location.protocol + "//" + window.location.hostname + (location.port && ":" + location.port));
  options = options || {};
  namespace = options.namespace || 'cartel';

  injectSocketIO(function() {
    var socket = io.connect(url + '/' + namespace, options);

    // kick things off
    Client.socket = socket;
    ready();
  });
};


var readyCallbacks = [],
    isReady = false,
    ready = function() {
      isReady = true;
      for (var i = readyCallbacks.length - 1; i >= 0; i--) {
        readyCallbacks[i]();
      }
    };

/**
 * Execute callback after client socket has connected.
 *
 * @param {Function} callback
 * @api public
 */

Client.onReady = function(callback) {
  if (isReady) {
    callback();
  } else {
    readyCallbacks.push(callback);
  }
};

/**
 * Inject socket.io client js library into page and call
 * callback when loaded.
 *
 * @param {Function} callback
 * @api private
 */

function injectSocketIO(callback) {
  script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.onload = callback;
  script.src = '/socket.io/socket.io.js';
  document.getElementsByTagName('head')[0].appendChild(script);
}
