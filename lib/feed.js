var Payload = require('./payload'),
    Request = require('./request'),
    SocketInterface = require('./socket_interface');


/**
 * Inject dependencies, see Base.with
 */

module.exports.with = function(locals) {
  var Base = require('./base').with(locals),
      Feed = Base.extend(),
      instances = {};

  /**
   * Get an instance of a Feed with a particular resource
   * name if it has already been instantiated.
   *
   * @param {String} resource
   * @return {Feed}
   * @api public
   */

  Feed.getInstance = function(resource) {
    return instances[resource];
  };

  /**
   * Feed initializer
   */

  Feed.use(function(instance) {

    // Universal client/server socket interface
    instance.socketInterface = new SocketInterface();

    instance.on('@initialize', function(options) {
      // Set properties
      instance.resource = options.resource || instance.resource;
      instance.idProperty = options.idProperty || instance.idProperty || 'id';
      instance.actions = options.actions || instance.actions || {};

      if (!instance.resource) throw "must define a resource";

      // Track instances by name of resource
      instances[instance.resource] = instance;

      // Setup configured actions
      var callback;
      function makeScopedListener(callback) {
        return function() {
          callback.apply(instance, arguments);
        };
      }
      for (var eventName in instance.actions) {
        callback = instance.actions[eventName];

        // If value is not a function then it is a named method
        // on instance.
        if (typeof callback !== 'function') {
          callback = instance[callback];
        }

        instance.on(eventName, makeScopedListener(callback));
      }
    });
  });

  /**
   * Send a request. When called from a server context will send 
   * request to all connected channels. When called from client 
   * context will send request to listening server controller.
   *
   * Example 1:
   *
   *    feed.send(request, callback)
   *
   * Example 2:
   *
   *    feed.send('create', objects, callback);
   *
   * @param {*} request or (action and objects)
   * @param {Function} remote callback (client only)
   * @api public
   */

  Feed.prototype.send = function(actionOrRequest) {
    var _this = this,
        args, request, action, objects, callback;

    args = Array.prototype.slice.call(arguments, 0);

    if (typeof args[args.length - 1] === "function") {
      callback = args.pop();
    }

    if (typeof actionOrRequest === "string" || actionOrRequest instanceof String) {
      action = args.shift();
      objects = args.shift();
      request = new Request({
        headers: { action: action },
        objects: objects
      });
    } else {
      request = actionOrRequest;
    }

    function wrappedCallback(message) {
      message = new Payload(message);
      _this.emit('@reply:'+request.headers.action, request, message);
      if (callback) callback(message);
    }

    this.emit('@send:'+request.headers.action, request);
    this.socketInterface.send(this.resource, request, wrappedCallback);
  };

  /**
   * Send a create request with the specified objects.
   *
   * @param {Array} objects to be created
   * @param {Function} remote callback
   * @api public
   */

  Feed.prototype.create = function(objects, remoteCallback) {
    var request = new Request({headers: {action: 'create'}, objects: objects});
    this.send(request, remoteCallback);
  };

  /**
   * Send a read request with parameters.
   *
   * @param {*} parameters to be encoded in message
   * @param {Function} remote callback
   * @api public
   */

  Feed.prototype.read = function(params, remoteCallback) {
    var request = new Request({headers: {action: 'read'}, meta: {params: params}});
    this.send(request, remoteCallback);
  };

  /**
   * Send an update request for the specified objects.
   *
   * @param {Array} objects to be updated
   * @param {Function} remote callback
   * @api public
   */

  Feed.prototype.update = function(objects, remoteCallback) {
    var request = new Request({headers: {action: 'update'}, objects: objects});
    this.send(request, remoteCallback);
  };

  /**
   * Send a delete request for the specified objects.
   *
   * @param {Array} objects to be deleted
   * @param {Function} remote callback
   * @api public
   */

  Feed.prototype.delete = function(objects, remoteCallback) {
    var request = new Request({headers: {action: 'delete'}, objects: objects});
    this.send(request, remoteCallback);
  };

  /**
   * Teardown listeners associated with feed. Plugins can
   * use this event to unbind their listeners.
   *
   * @api public
   */

  Feed.prototype.teardown = function() {
    this.emit('@teardown');
    this.removeAllListeners();
  };

  return Feed;
};
