var _ = require('underscore'),
    Payload = require('../payload'),
    Dispatcher = require('../dispatcher'),
    Roster = require('./roster');


/**
 * The Pusher plugin will manage a roster of all connected
 * channels and allow publishing object events to those channels.
 * Additionally, channel clients can subscribe and unsubscribe from
 * event publishing by sending `subscribe` and `unsubscribe`
 * messages.
 */

module.exports = function(controller) {
  var dispatcher, socketRoster;

  controller.on('@initialize', function() {
    dispatcher = new Dispatcher('@pusher:' + controller.resource);
    socketRoster = new Roster();

    dispatcher.subscribe(notifyConcernedSockets);

    controller.on('@connect', subscribe);
    controller.on('@disconnect', unsubscribe);
    controller.on('subscribe', subscribeForStar);
    controller.on('unsubscribe', unsubscribeForStar);

    // Add public methods into controller
    controller.publish = publish;
    controller.subscribe = subscribe;
    controller.unsubscribe = unsubscribe;

    // Unbindind listeners when controller is destroyed
    controller.on('@teardown', function() {
      dispatcher.unsubscribe(notifyConcernedSockets);

      controller.removeListener('@connect', subscribe);
      controller.removeListener('@disconnect', unsubscribe);
      controller.removeListener('subscribe', subscribeForStar);
      controller.removeListener('unsubscribe', unsubscribeForStar);
    });
  });


  /** 
   * Publish action on object to get pushed to all sockets.
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
   * Subscribe a socket to receive events.
   *
   * @param {Socket} socket
   * @api public
   */

  function subscribe(socket) {
    socketRoster.add('*', socket);
  }

  /**
   * Unsubscribe a socket from receiving events.
   *
   * @param {Socket} socket
   * @api public
   */

  function unsubscribe(socket) {
    socketRoster.remove('*', socket);
  }

  /**
   * Subscribe socket if request contains object with
   * id of '*'. This enables subscribe requests to work
   * for both Informer and Pusher.
   *
   * @param {Socket} socket
   * @param {Payload} request
   * @api private
   */

  function subscribeForStar(socket, request) {
    for (var i = request.objects.length - 1; i >= 0; i--) {
      if (request.objects[i][this.idProperty] === '*') {
        this.subscribe(socket);
      }
    }
  }

  /**
   * Unsubscribe socket if request contains object with
   * id of '*'. This enables unsubscribe requests to work
   * for both Informer and Pusher.
   *
   * @param {Socket} socket
   * @param {Payload} request
   * @api private
   */

  function unsubscribeForStar(socket, request) {
    for (var i = request.objects.length - 1; i >= 0; i--) {
      if (request.objects[i][this.idProperty] === '*') {
        this.unsubscribe(socket);
      }
    }
  }

  /**
   * Notify any concerned sockets about changes to objects
   *
   * @param {String} action
   * @param {Array} objects
   * @api private
   */

  function notifyConcernedSockets(action, objects) {
    socketRoster.get('*').forEach(function(socket) {
      var message = new Payload({
        headers: { action: action, status: 200 },
        objects: objects
      });
      socket.emit(controller.resource, message);
    });
  }

};
