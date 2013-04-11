var URL = require('url'),
    FileSystem = require('fs'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    SocketIo = require('socket.io'),
    Server;


module.exports = Server = {};

// Make server an EventEmitter
EventEmitter.call(Server);
_.extend(Server, EventEmitter.prototype);


/**
 * Hook into the httpServer and setup socket connection
 * and static file serving of client library.
 *
 * Examples:
 *
 *    Server.createServer(app[, config])
 *    Server.createServer(app, socketIo[, config])
 *
 * @param {http.Server} http server
 * @param {Object|socket.io.Manager} configuration or socket manager
 * @param {Object} configuration
 * @api public
 */

Server.createServer = function(httpServer, socketManager, config) {

  // createServer(app[, config])
  if (!socketManager || typeof socketManager.listen !== 'function') {
    config = socketManager;
    socketManager = SocketIo.listen(httpServer, config);
  }

  var namespace = config.namespace || '/cartel';
  this.socketNamespace = socketManager.of(namespace);

  setupStaticClientServing(httpServer, namespace + '/client.js', '/../client/cartel-client.js');

  Server.isReady = true;
  this.emit('ready');
};

/**
 * Execute callback after Server.socketNamespace exists.
 *
 * @param {Function} callback
 * @api public
 */

Server.onReady = function(callback) {
  if (this.isReady) {
    callback();
  } else {
    this.once('ready', callback);
  }
};

/**
 * Serve a static file at a particular end point
 *
 * @param {http.Server} http server
 * @param {String} url path
 * @param {String} location of file
 * @api private
 */

function setupStaticClientServing(httpServer, path, file) {
  interceptServerRequest(httpServer, path,
    function(request, response) {
      FileSystem.readFile(__dirname + file, function (err, data) {
        if (err) {
          response.writeHead(500);
          return response.end('Error loading ModelServer client');
        }

        response.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Content-Length': data.length
        });
        response.end(data);
      });
  });
}

/**
 * Insert request handler for a particular path on an http server.
 *
 * @param {http.Server} http server
 * @param {String} url path
 * @param {Function} request handler
 * @api private
 */

function interceptServerRequest(server, path, requestHandler) {

  // pull out current listeners on server
  var listeners = server.listeners('request').slice(0);
  server.removeAllListeners('request');

  server.on('request', function(request, response) {
    if (path == request.url.substr(0, path.length)) {
      requestHandler(request, response);
    }
    else {
      listeners.forEach(function(listener) {
        listener.call(server, request, response);
      });
    }
  });
}
