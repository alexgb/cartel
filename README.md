# Cartel

A real-time bidirectional data transport between node.js and the browser. Hook it up to your backend data layer and frontend framework of choice.

Cartel is a wrapper around [Socket.IO](https://github.com/learnBoost/socket.io), and provides a data transport for objects oriented around the concept of CRUD actions. Cartel Channels can act as a simple WebSocket based replacement for Ajax requests, but also go much further by offering the ability to push data to clients and manage the process of propagating data changes to only interested clients.

*Cartel is currently in proof-of-concept form and is not yet production ready.*

## Contents

  * [Basic Usage](#simpleexample)
  * [Using an Object Push Strategy](#pushexample)
  * [Examples](#examples)
  * [Channel API](#api)
  * [Propagation Strategies](#propagation)
  * [Channel Events](#events)
  * [Defining Channels](#defining)
  * [Message Specification](#messagespec)

## <a id="simpleexample"></a>Basic Usage

A basic example of using Cartel to do classic client request based CRUD.

### Client

```javascript
// Load the Cartel client library.
// <script src="/cartel/client.js" type="text/javascript"></script>

// Start the cartel socket connection.
Cartel.connect();

// Instantiate a channel instance.
var postsChannel = Cartel.Channel.define({
  resource: 'posts'
});

// Send a read request to the server.
postsChannel.read({title: "*recipe"}, function(response) { 
  // update view with returned posts (response.objects)
});

// Send an update request to server.
postsChannel.update({id: 100, title: "Baked Eggs"});
```

### Server

```javascript
var Http = require('http'),
    Cartel = require('cartel');

var postsChannel = Cartel.Channel.define({
  resource: 'posts'
});

// Respond to read requests.
postsChannel.on('read', function(request, response) {
  response.send(Posts.find(request.getParams()));
});

// Respond to update requests.
postsChannel.on('update', function(request, response) {
  var posts = request.objects.map(function(post) {
    return Post.get(post.id).update(post);
  });

  response.send(posts);
});

// Create http server and bind cartel.
var app = Http.createServer();
Cartel.createServer(app);
app.listen(8080);
```

## <a id="pushexample"></a>Using an Object Push Strategy

In the following example our client is able to fetch a collection of objects and subsequently receive notifications if any of those objects are updated by another client.

### Client

```javascript
var postsChannel = Cartel.Channel.define({
  resource: 'posts',

  actions: {
    update: 'onUpdate'
  },

  onUpdate: function(request) {
    request.objects.forEach(function(post) {
      // update with new post attributes
    });
  }
});

// Bind your search form to channel#read
$('.search').on('keyup', function() {
  postsChannel.read({title: "*recipe"}, function(response) { 
    // update view with returned posts (response.objects)
  });
});

// Bind your edit form to channel#update
$(.edit-form).on('submit', function(e) {
  postsChannel.update($(this).serializeJSON());
  e.preventDefault();
});
```

### Server

```javascript
var postsChannel = Cartel.Channel.define({
  resource: 'posts',

  // Use the Informer strategy so that any client that holds objects
  // obtained through a read operation will receive updates for
  // those objects.
  use: Cartel.strategies.Informer,

  actions: {
    read: 'onRead',
    update: 'onUpdate'
  },

  onRead: function(request, response) {
    response.send(Posts.find(request.getParams()));
  },

  onUpdate: function(request, response) {
    var posts = response.objects.map(function(post) {
      return Post.get(post.id).update(post);
    });

    // Publish update to all connected clients
    this.publish('update', posts);
  }
});
```

## <a id="examples"></a>Examples

See the examples directory for a more complete MVCTodo based example app.

```bash
node examples/todos/server
```

## <a id="api"></a>Channel API

A channel is configured per resource to accept inbound requests, and is also the point through which outbound requests are sent.

The primary Channel API is the same on client and server, the difference being that server side Channels send their messages to all connected clients and client side Channels send their messages only to the server they are connected to. Also, remote acknowledgment callbacks, `remoteCallback`, are only available in client side channels.

#### `#send(message[, remoteCallback])`

Send an arbitrary message. See Messages specification section for message format details. Generally you'll want to use `create`, `read`, `update`, or `delete` methods to send basic CRUD messages.

#### `#create(objects[, remoteCallback])`

Send a create request with specified objects.

#### `#read(params[, remoteCallback])`

Send a read request with the specified parameters.

#### `#update(objects[, remoteCallback])`

Send an update request. Each object in the request must include an id value, which by default maps to `id` but can be configured per channel using `idProperty`.

#### `#delete(objects[, remoteCallback])`

Send a delete request where each object contains an id value.

#### `#on(action, listener)`

Attach a listener to the channel. Inbound requests will invoke events on the channel with the name of the request's action. The attached listener will be called with a request object. See the [Events](#events) section to see a full catalog of events.

## <a id="propagation"></a>Propagation Strategies

Cartel offers the `Pusher`, `Prophet`, and `Informer` plugins to help manage object event propagation to interested clients. These plugins are designed to cover general use scenarios, but may not be suitable for your specific needs, in which case use the plugin system and channel events to write your own.

The following strategies rely on using `Channel#publish(action, objects)` to publish object events to interested parties.

### Pusher

Use the pusher strategy to push object events to all connected clients through Cartel's dispatch mechanism.

### Prophet

The Prophet strategy will push objects matching predetermined criteria to subscribed clients. Clients should either register themselves through a message with action `subscribe` or the server should subscribe them manually using `Channel#subscribe(property, value, clientSocket)`.

### Informer

The Informer strategy attempts to intelligently monitor objects sent over the channel to determine objects the client will want change events for. For example, objects sent in a response to a `read`, or `create` request are considered interesting to a client and any updates to those objects will be propagated to that client in the future. See the code for further explanation of how the roster of clients and objects is managed.

## <a id="events"></a>Channel Events

Channel events are namespaced. You can attach a listener to any event in a namespace by binding to `foo:*`, or to all events using `*`. Handler's attached in these cases will have an extra first argument which is the full name of the event.

Channels have the following event interface where `ACTION` can be any message action i.e. `create` or `update`.

#### Common Events:

 * `@initialize` (options) – called at instantiation with constructor options
 * `@connect` (socket) – when socket connection is established
 * `ACTION` (reqest, response[, ackCallback]) – when a message is received on channel where `ACTION` is the name of the messages action header
 * `@send:ACTION` (message) – when a message is sent through channel
 * `@reply:ACTION` (response, request) – when a reply is received from sent message
 * `@disconnect` (socket) - when socket connection is dropped
 * `@teardown` () – when a channel is destroyed

#### Server Only Events:

 * `@request:ACTION` (socket, request, response) – when a message is received, before standard `ACTION` event is fired.
 * `@respond:ACTION` (socket, request, response) – when a message is received, after standard `ACTION` event is fired.
 * `@error` (error, response) – when a response contains an error


## <a id="defining"></a>Defining Channels

Server and client channels use a common inheritance system outlined below.

### Channel.extend(prototypeProperties, staticProperties)

Creates a subclass.

```javascript
var AppChannel = Channel.extend({
  idProperty: 'uid',
  actions: {
    read: 'onRead',
    delete: 'onDelete'
  }
});
```

### Channel.define(prototypeProperties, staticProperties)

Creates a subclass and instantiates it. Typically you'll use `define` when declaratively defining your channels.

```javascript
AppController.define({
  resource: 'posts',
  onRead: function() { /*...*/ },
  onDelete: function() { /*...* }
});
```

### Channel.use(pluginFn)

Plugins provide a useful way of hooking into channels at the time of instantiation. This can be a useful way to hook your feeds into your client or server side data layer. Plugins are inheritable so a subclass will use all its parent class' plugins as well as its own. The `pluginFn` will be called with an instance of the channel.

```javascript
Channel.use(function(channel) {
  channel.on('update', updateMyFrameworkCollections);
});
```

### Channel(Options)

When instantiating a feed directly you can specify the `resource`, `actions`, and `idProperty` of the instance.

```javascript
var postsChannel = new Channel({
  resource: 'posts',
  idProperty: 'uid'
});
```

## <a id="messagespec"></a>Message Specification

```
{
    headers: {},
    objects: [],
    meta: {}
}
```

#### `headers`

Headers are simple key value pairs used by channels to determine the type of message being received. Headers have the following required keys.

  * action: create|read|update|delete|*

#### `objects`

This represents an array of instances of the resource associated with the channel. It may be incomplete, such as in the case of an update request which may contain an id value and only one attribute. Or it may be empty as in the case of a read request.

#### `meta`

Arbitrary payload data which can be used by the client to implement other actions or to describe the body payload.

### Requests

Request messages must include an action header, which can be one of create, read, update, delete or a user specified action.

### Responses

A response message must have a status header, which should correlate to standard http status values.

## TODO

 * Add support for redis based pub/sub to central event dispatching for cross process support.

