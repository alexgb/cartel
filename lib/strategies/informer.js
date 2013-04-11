var _ = require('underscore'),
    Payload = require('../payload'),
    Dispatcher = require('../dispatcher'),
    Roster = require('./roster');


/**
 * The Informer plugin attempts to manage a roster of sockets
 * and the objects they are interested in by watching requests,
 * responses, and sent messages.
 *
 * Inbound requests:
 *
 *   * `read` : resets socket's interested objects to those in
 *     response. If header `append` is true, then read response
 *     objects are appended to list of interested objects.
 *   * `create` : objects in response are added to list of objects
 *     for socket.
 *   * `delete` : objects in request are removed from list of
 *     objects for socket.
 *
 * Outbound requests:
 *
 *   * `create` : add objects to roster for all connected sockets
 *   * `delete` : remove objects from roster
 *
 * Managing subscriptions:
 *
 * Subscriptions can be managed from the channel using `subscribe`,
 * `unsubscribe`, and `unsubscribeall` messages. For `subscribe`
 * and `unsubscribe` include the objects that should be removed
 * from the roster.
 */

module.exports = function(controller) {
  var dispatcher, socketRoster;

  controller.on('@initialize', function() {
    dispatcher = new Dispatcher('@informer:' + controller.resource);
    socketRoster = new Roster();

    dispatcher.subscribe(notifyConcernedSockets);

    controller.on('@respond:read', subscribeResponseObjects);
    controller.on('@respond:create', subscribeResponseObjects);
    controller.on('@respond:delete', unsubscribeRequestObjectsOnSuccess);
    controller.on('@send:create', subscribeMessageObjects);
    controller.on('@send:delete', unsubscribeMessageObjects);
    controller.on('@disconnect', unsubscribeSocket);
    controller.on('subscribe', subscribeRequestObjects);
    controller.on('unsubscribe', unsubscribeRequestObjects);
    controller.on('unsubscribeall', unsubscribeSocket);

    // Add public methods into controller
    controller.publish = publish;
    controller.subscribe = subscribe;
    controller.unsubscribe = unsubscribe;
    controller.unsubscribeObject = unsubscribeObject;
    controller.unsubscribeSocket = unsubscribeSocket;

    // Unbind listeners when controller is destroyed
    controller.on('@teardown', function() {
      dispatcher.unsubscribe(notifyConcernedSockets);

      controller.removeListener('@respond:read', subscribeResponseObjects);
      controller.removeListener('@respond:create', subscribeResponseObjects);
      controller.removeListener('@respond:delete', unsubscribeRequestObjectsOnSuccess);
      controller.removeListener('@send:create', subscribeMessageObjects);
      controller.removeListener('@send:delete', unsubscribeMessageObjects);
      controller.removeListener('@disconnect', unsubscribeSocket);
      controller.removeListener('subscribe', subscribeRequestObjects);
      controller.removeListener('unsubscribe', unsubscribeRequestObjects);
      controller.removeListener('unsubscribeall', unsubscribeSocket);
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
   * Subscribe a socket to receive events concerning object
   *
   * @param {Socket} socket
   * @param {Object|Array} object or array of objects
   * @api public
   */

  function subscribe(socket, object) {
    if (_.isArray(object)) {
      for (var i = object.length - 1; i >= 0; i--) {
        this.subscribe(socket, object[i]);
      }
    } else {
      socketRoster.add(object[this.idProperty], socket);
    }
  }

  /**
   * Unsubscribe a socket from receiving events for the specified
   * object or objects
   *
   * @param {Socket} socket
   * @param {Object|Array} object or array of objects
   * @api public
   */

  function unsubscribe(socket, object) {
    if (_.isArray(object)) {
      for (var i = object.length - 1; i >= 0; i--) {
        this.unsubscribe(socket, object[i]);
      }
    } else {
      socketRoster.remove(object[this.idProperty], socket);
    }
  }

  /**
   * Unsubscribe an object and release registered sockets from
   * receiving events for that object.
   *
   * @param {Object|Array} object or array of objects
   * @api public
   */

  function unsubscribeObject(object) {
    if (_.isArray(object)) {
      for (var i = object.length - 1; i >= 0; i--) {
        this.unsubscribeObject(object[i]);
      }
    } else {
      socketRoster.destroyKey(object[this.idProperty]);
    }
  }

  /**
   * Unsubscribe a socket from receiving object events.
   *
   * @param {Socket|Array} socket or array of sockets
   * @api public
   */

  function unsubscribeSocket(socket) {
    if (_.isArray(socket)) {
      for (var i = socket.length - 1; i >= 0; i--) {
        this.unsubscribeSocket(socket[i]);
      }
    } else {
      socketRoster.removeFromAll(socket);
    }
  }

  /**
   * Inspect a response for object ids and record that the client is
   * interested in event updates on these objects. If the request is
   * a 'read' request and does not have header 'append' set to true,
   * then we automatically unsubscribe the sockets existing 
   * subscriptions.
   *
   * @param {Socket} socket
   * @param {Payload} request
   * @param {Payload} response
   * @api private
   */

  function subscribeResponseObjects(socket, request, response) {
    if (response.success()) {
      if (request.getAction() === 'read' && !request.headers.append) {
        controller.unsubscribeSocket(socket);
      }
      controller.subscribe(socket, response.objects);
    }
  }

  /**
   * Unsubscribe objects contained in request.
   *
   * @param {Socket} socket
   * @param {Payload} request
   * @param {Payload} response
   * @api private
   */

  function unsubscribeRequestObjectsOnSuccess(socket, request, response) {
    if (response.success()) {
      controller.unsubscribe(socket, request.objects);
    }
  }

  /**
   * Subscribe objects from request regardless of response.
   *
   * @param {Socket} socket
   * @param {Payload} request
   * @api private
   */

  function subscribeRequestObjects(socket, request) {
    controller.subscribe(socket, request.objects);
  }

  /**
   * Unsubscribe objects from request regardless of response.
   *
   * @param {Socket} socket
   * @param {Payload} request
   * @api private
   */

  function unsubscribeRequestObjects(socket, request) {
    controller.unsubscribe(socket, request.objects);
  }

  /**
   * Subscribe every socket to objects in message.
   *
   * @param {Payload} message
   * @api private
   */

  function subscribeMessageObjects(message) {
    var sockets = _.values(controller.socketInterface.sockets);

    for (var i = sockets.length - 1; i >= 0; i--) {
      controller.subscribe(sockets[i], message.objects);
    }
  }

  /**
   * Unsubscribe objects in message.
   *
   * @param {Payload} message
   * @api private
   */

  function unsubscribeMessageObjects(message) {
    controller.unsubscribeObject(message.objects);
  }

  /**
   * Notify any concerned sockets about changes to objects
   *
   * @param {String} action
   * @param {Array} objects
   * @api private
   */

  function notifyConcernedSockets(action, objects) {
    if (!(action === 'update' || action === "delete")) {
      return;
    }

    var concernedSockets = [],
        socketObjects = {};

    // Notify sockets listening to specific objects
    objects.forEach(function(object) {
      var objectId = object[controller.idProperty],
          sockets = socketRoster.get(objectId);

      sockets.forEach(function(socket) {
        if (!~concernedSockets.indexOf(socket)) concernedSockets.push(socket);
        socketObjects[socket.id] = socketObjects[socket.id] || [];
        socketObjects[socket.id].push(object);
      });
    });

    concernedSockets.forEach(function(socket) {
      var message = new Payload({
        headers: { action: action },
        objects: socketObjects[socket.id]
      });
      socket.emit(controller.resource, message);
    });
  }

};
