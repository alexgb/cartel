var _ = require('underscore'),
    Payload = require('../payload'),
    Dispatcher = require('../dispatcher'),
    Roster = require('./match_roster');


/**
 * The Prophet will associate sockets with predetermined object criteria
 * so that any actions that affect matched objects will be pushed to
 * a specified subset of sockets.
 */

module.exports = function(controller) {
  var dispatcher, socketRoster;

  controller.on('@initialize', function() {
    dispatcher = new Dispatcher('@prophet:' + controller.resource);
    socketRoster = new Roster();

    dispatcher.subscribe(notifyConcernedSockets);

    controller.on('@disconnect', unsubscribeSocket);
    controller.on('@request:subscribe', handleSubscribeRequest);
    controller.on('@request:unsubscribe', handleUnsubscribeRequest);

    // Add public methods into controller
    controller.publish = publish;
    controller.subscribe = subscribe;
    controller.unsubscribe = unsubscribe;
    controller.unsubscribeSocket = unsubscribeSocket;

    // Unbindind listeners when controller is destroyed
    controller.on('@teardown', function() {
      dispatcher.unsubscribe(notifyConcernedSockets);

      controller.removeListener('@disconnect', unsubscribe);
      controller.removeListener('@request:subscribe', handleSubscribeRequest);
      controller.removeListener('@request:unsubscribe', handleUnsubscribeRequest);
    });
  });

  /** 
   * Publish action on objects so that interested sockets can
   * be informed.
   * 
   * @param {String} action
   * @param {Array} objects
   * @api public
   */

  function publish(action, objects) {
    if (!_.isArray(objects)) objects = [objects];
    dispatcher.publish(action, objects);
  }

  /**
   * Subscribe a socket to match on a given object property and match value.
   *
   * @param {String} propertyName
   * @param {String|Number|RegExp} matchValue
   * @param {Socket} socket
   * @api public
   */

  function subscribe(propertyName, matchValue, socket) {
    socketRoster.add(propertyName, matchValue, socket);
  }

  /**
   * Unsubscribe a socket for a match on a given object property and match 
   * value.
   *
   * @param {String} propertyName
   * @param {String|Number|RegExp} matchValue
   * @param {Socket} socket
   * @api public
   */

  function unsubscribe(propertyName, matchValue, socket) {
    socketRoster.remove(propertyName, matchValue, socket);
  }

  /**
   * Completely unsubscribe a socket from all match values.
   *
   * @param {Socket} socket
   * @api public
   */

  function unsubscribeSocket(socket) {
    socketRoster.removeFromAll(socket);
  }

  /**
   * Subscribe socket based on intercepted request message.
   *
   * @param {Socket} socket
   * @param {Payload} request
   * @api private
   */

  function handleSubscribeRequest(socket, request) {
    var propertyName = request.meta.property,
        matchValue = request.meta.match;

    subscribe(propertyName, matchValue, socket);
  }

  /**
   * Unsubscribe socket based on intercepted request message.
   *
   * @param {Socket} socket
   * @param {Payload} request
   * @api private
   */

  function handleUnsubscribeRequest(socket, request) {
    var propertyName = request.meta.property,
        matchValue = request.meta.match;

    unsubscribe(propertyName, matchValue, socket);
  }

  /**
   * Notify any concerned sockets about changes to objects
   *
   * @param {String} action
   * @param {Array} objects
   * @api private
   */

  function notifyConcernedSockets(action, objects) {
    socketRoster.forEachMatch(objects, function(socket, objects) {
      socket.emit(controller.resource, new Payload({
        headers: { action: action },
        objects: objects
      }));
    });
  }

};
