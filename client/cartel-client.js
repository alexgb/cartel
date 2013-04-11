;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){
var Cartel = require('./client');

Cartel.Channel = require('./channel'),

window.Cartel = Cartel;

},{"./client":2,"./channel":3}],2:[function(require,module,exports){

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

},{}],3:[function(require,module,exports){
var Client = require('./client'),
    Payload = require('../../lib/payload'),
    Feed = require('../../lib/feed').with({
      EventEmitter: require('./event_emitter')
    }),
    Channel;

/**
 * A channel is a bidirectional data exchange for a named resource. 
 * A channel is configured on the client to accept inbound CRUD 
 * requests and to be the transport for outbound CRUD requests. 
 *
 * @api public
 */

module.exports = Channel = Feed.extend();


/**
 * Channel initialization
 */

Channel.on('@initialize', function() {
  var _this = this;

  this.socketInterface.on('connect', function() {
    _this.emit('@connect');
  });

  this.socketInterface.on('disconnect', function() {
    _this.emit('@disconnect');
  });

  this.socketInterface.on(this.resource, function(message) {
    _this.parseMessage(message);
  });

  Client.onReady(function() {
    _this.socketInterface.realize(Client.socket);
  });

  if (this.debug) {
    this.on('*', debug);
  }
});

/**
 * Parse incoming messages.
 *
 * @param {Object} message
 * @api private
 */

Channel.prototype.parseMessage = function(message) {
  if (!message.headers || !message.headers.action) {
    throw "Received an invalid socket message";
  }
  this.emit(message.headers.action, new Payload(message));
};

/**
 * log debug message to console
 *
 * @api private
 */

function debug() {
  if (console && console.log) {
    args = Array.prototype.slice.call(arguments, 0);
    args[0] = "%c" + args[0];
    args.splice(1, 0, 'background-color:#bbb;color:white;padding:2px 6px;border-radius:3px;');
    console.log.apply(console, args);
  }
}

},{"./client":2,"../../lib/payload":4,"../../lib/feed":5,"./event_emitter":6}],4:[function(require,module,exports){
var util = require('./util');


module.exports = Payload;


/**
 * Message wrapper object
 *
 * @param {Object} message
 */

function Payload(message) {
  util.merge(this, message);

  this.headers = this.headers || {};
  this.objects = this.objects || [];
  this.meta = this.meta || {};
}

/**
 * Set message header value
 *
 * @param {String} key
 * @param {String|Number} value
 * @api public
 */

Payload.prototype.setHeader = function(key, value) {
  this.headers[key] = value;
};

/**
 * Set error on message. Use http style error codes.
 *
 * @param {Number} code
 * @param {String} message
 * @api public
 */

Payload.prototype.setError = function(code, message) {
  this.setHeader('status', code);
  this.setHeader('message', message);
};

/**
 * Check if message has an error code
 *
 * @return {Boolean}
 * @api public
 */

Payload.prototype.error = function() {
  return !this.success();
};

/**
 * Check if message is successful
 *
 * @return {Boolean}
 * @api public
 */

Payload.prototype.success = function() {
  return this.headers.status >= 200 && this.headers.status < 300;
};

/**
 * Returns a error code and message pair
 *
 * @return {Array|undefined}
 * @api public
 */

Payload.prototype.getError = function() {
  if (this.error()) {
    return [this.headers.status, this.headers.message];
  }
};

/**
 * Returns the action associated with this message.
 *
 * @return {String}
 * @api public
 */

Payload.prototype.getAction = function() {
  return this.headers.action;
};

/**
 * Returns the request parameters.
 *
 * @return {*}
 * @api public
 */

Payload.prototype.getParams = function() {
  return this.meta.params || {};
};

/**
 * Ensure only message is encoded as JSON.
 *
 * @return {Object}
 * @api public
 */

Payload.prototype.toJSON = function() {
  return {
    headers: this.headers,
    objects: this.objects,
    meta: this.meta
  };
};

},{"./util":7}],5:[function(require,module,exports){
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

},{"./payload":4,"./request":8,"./socket_interface":9,"./base":10}],6:[function(require,module,exports){
var indexOf = require('../../lib/util').indexOf;

module.exports = EventEmitter;

/**
 * Client side event emitter implementation to match the API of
 * node's events.EventEmitter.
 *
 * @api private
 */

function EventEmitter() {
  this._handlers = {};
}

/**
 * Add event listener.
 *
 * @param {String} event
 * @param {Function} callback
 * @api public
 */

EventEmitter.prototype.addListener = function(event, callback) {
  this._handlers[event] = this._handlers[event] || [];
  this._handlers[event].push(callback);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;

/**
 * Add event listener and fire only once.
 *
 * @param {String} event
 * @param {Function} callback
 * @api public
 */

EventEmitter.prototype.once = function(event, callback) {
  var _this = this;

  function wrapper() {
    callback.apply(null, arguments);
    _this.removeListener(event, wrapper);
  }
  callback._wrappedBy = wrapper;

  this.addListener(event, wrapper);
};

/**
 * Remove an event listener.
 *
 * @param {String} event
 * @param {Function} callback
 * @api public
 */

EventEmitter.prototype.removeListener = function(event, callback) {
  var handlers = this.listeners(event),
      index = indexOf(handlers, callback._wrappedBy || callback);

  if (~index) {
    handlers.splice(index, 1);
  }
};

/**
 * Remove all listeners for an event.
 *
 * @param {String} event
 * @api public
 */

EventEmitter.prototype.removeAllListeners = function(event) {
  if (event) {
    this._handlers[event] = [];
  } else {
    this._handlers = {};
  }
};

/**
 * Get all listeners for an event.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

EventEmitter.prototype.listeners = function(event) {
  return this._handlers[event] || [];
};

/**
 * Emit an event. Will pass any additional arguments to event
 * listers.
 *
 * @param {String} event
 * @param {*} arguments to pass to listeners
 * @api public
 */

EventEmitter.prototype.emit = function(event) {
  var handlers = this.listeners(event),
      args = Array.prototype.slice.call(arguments, 1);

  for (var i = handlers.length - 1; i >= 0; i--) {
    handlers[i].apply(null, args);
  }
};




},{"../../lib/util":7}],7:[function(require,module,exports){

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

},{}],9:[function(require,module,exports){

module.exports = SocketInterface;

/**
 * Universal interface for socket.io.Namespace and
 * socket.io.Socket. Will queue calls to .on and .send
 * until socket connection is made.
 *
 * @api private
 */

function SocketInterface() {
  queue(this, 'on');
  queue(this, 'send');
}

/**
 * Realize socket within interface and flush any calls
 * to .on and .send
 *
 * @param {socket.io.Namespace|socket.io.Socket} socket
 * @api private
 */

SocketInterface.prototype.realize = function(socket) {
  this.socket = socket;
  this.on.flush();
  this.send.flush();
};

/**
 * Bind callback to socket event
 *
 * @api public
 */

SocketInterface.prototype.on = function(callback) {
  this.socket.on.apply(this.socket, arguments);
};

/**
 * Send message using socket
 *
 * @api public
 */

SocketInterface.prototype.send = function() {
  this.socket.emit.apply(this.socket, arguments);
};


/**
 * Create a method queue for named method on object.
 * Call object.method.flush() to flush the queue and restore
 * original method.
 *
 * @param {Object} object
 * @param {String} methodName
 * @api private
 */

function queue(object, methodName) {
  var existing = object[methodName];

  function queuedMethod() {
    queuedMethod.queue.push(arguments);
  }

  queuedMethod.queue = [];
  queuedMethod.flush = function() {
    for (var i = queuedMethod.queue.length - 1; i >= 0; i--) {
      existing.apply(object, queuedMethod.queue[i]);
    }
    object[methodName] = existing;
  };

  object[methodName] = queuedMethod;
}

},{}],8:[function(require,module,exports){
var util = require('./util');
    Payload = require('./payload');


module.exports = Request;

/**
 * An outbound request message.
 */

function Request(message) {
  Payload.call(this, message);

  if (!this.headers.action) {
    throw("Request must have an action header");
  }
}

util.merge(Request.prototype, Payload.prototype);

},{"./util":7,"./payload":4}],10:[function(require,module,exports){
var util = require('./util');

/**
 * Inject dependencies so that Base can be used in
 * either browser or node context.
 *
 * Expample:
 *
 *    var Base = require('base').with({
 *      EventEmitter: require('events').EventEmitter
 *    });
 *
 */

module.exports.with = function(locals) {

  /**
   * Base object contructor.
   *
   * Base objects have the following properties:
   *
   *  * inheritance using `extend`
   *  * instantiation using `define`
   *  * plugins using `use`
   *  * life cycle events using an EventEmitter implementation
   *
   * @param {Object} options
   */

  function Base(options) {
    options = options || {};
    locals.EventEmitter.call(this);

    // Initialize plugins, see addInheritablePluginsBehavior
    var plugins = this.getPlugins();
    for (var i = plugins.length - 1; i >= 0; i--) {
      plugins[i](this);
    }

    this.initialize(options);
    this.emit('@initialize', options);
  }

  util.merge(Base.prototype, locals.EventEmitter.prototype);

  /**
   * noop
   */

  Base.prototype.initialize = function() {};

  // add behaviors
  addInheritanceBehavior(Base);
  addInheritablePluginsBehavior(Base);

  /**
   * Hook into lifecycle events of any Base object instance.
   * Context of callback is set to instance.
   *
   * @param {String} event
   * @param {Function} callback
   * @api public
   */
  Base.on = function(event, callback) {
    this.use(function(instance) {
      instance.on(event, function() {
        callback.apply(instance, arguments);
      });
    });
  };

  /**
   * Emit an event with support for event namespaces. Emitting an event
   * named 'foo:bar' will fire event handlers normally for 'foo:bar', but
   * will also fire event handlers, where the first argument is the original
   * event name, for 'foo:*' and '*'.
   *
   * @param {String} event
   * @param {*} remaining arguments
   * @api public
   */

  Base.prototype.emit = function(event) {
    var parts = event.split(":"),
        args = Array.prototype.slice.call(arguments, 0);

    locals.EventEmitter.prototype.emit.apply(this, arguments);

    args.splice(1, 0, event);
    while (parts.pop()) {
      args[0] = parts.concat('*').join(':');
      locals.EventEmitter.prototype.emit.apply(this, args);
    }
  };

  return Base;
};


/**
 * Setup simple inheritance support on constructor by
 * implementing create and define methods.
 *
 * @param {Function} klass
 */
function addInheritanceBehavior(klass) {
  klass.extend = function(prototypeProperties, staticProperties) {
    var parent = this;
    var child;

    if (prototypeProperties && Object.prototype.hasOwnProperty.call(prototypeProperties, 'constructor')) {
      child = prototypeProperties.constructor;
    } else {
      child = function() {
        return parent.apply(this, arguments);
      };
    }
    util.merge(child, parent, staticProperties);

    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    if (prototypeProperties) util.merge(child.prototype, prototypeProperties);

    child.__super__ = parent.prototype;
    child.__superConstructor__ = parent;

    return child;
  };

  klass.define = function() {
    var childClass = this.extend.apply(this, arguments);
    return new childClass();
  };
}


/** 
 * Setup support for inhertable plugins on contructor.
 * Each plugin function will be called with constructor
 * instance on initialization.
 * 
 * Example:
 *
 *    Klass.use(function(instance) {});
 *
 */

function addInheritablePluginsBehavior(klass) {
  var uses = [],
      oldExtend = klass.extend;

  klass.extend = function() {
    var childClass = oldExtend.apply(this, arguments);
    addInheritablePluginsBehavior(childClass);
    return childClass;
  };

  klass.use = function(pluginFn) {
    uses.push(pluginFn);
  };

  klass.getPlugins = function() {
    var all = [].concat(uses),
        parent = this.__superConstructor__;

    if (parent && parent.getPlugins) {
      all = all.concat(parent.getPlugins());
    }
    return all;
  };

  klass.prototype.getPlugins = function() {
    var plugins = this.constructor.getPlugins();

    if (this.use) {
      plugins.push(this.use);
    }
    return plugins;
  };
}

},{"./util":7}]},{},[1])
;