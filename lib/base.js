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
