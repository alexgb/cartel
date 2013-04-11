var Http = require('http'),
    fs = require('fs'),
    _ = require('underscore'),
    Static = require('node-static'),
    Cartel = require('../../../'),
    Model = require('./memory_store_model'),
    StoreAdapter = require('./memory_store_adapter'), 
    app;


var staticServer = new Static.Server(__dirname + '/../public');
app = Http.createServer(function(request, response) {
  request.addListener('end', function() {
    staticServer.serve(request, response, function (e, res) {
      if (e && (e.status === 404)) {
        staticServer.serveFile('/index.html', 404, {}, request, response);
      }
    });
  });
});

Cartel.createServer(app, {'log level': 2});


var Todo = Model.create({
  name: 'todos'
});

Cartel.Channel.use(Cartel.strategies.Prophet);
Cartel.Channel.define({
  resource: 'todos',
  use: StoreAdapter(Todo),

  actions: {
    read: 'onRead',
    create: 'onCreate',
    update: 'onUpdate',
    delete: 'onDestroy'
  },

  onRead: function(request, response) {
    response.send(Todo.find(request.getParams()));
  },

  onCreate: function(request, response) {
    response.send(request.objects.map(Todo.create));
  },

  onUpdate: function(request, response) {
    var idProperty = this.idProperty;

    request.objects.forEach(function(object){
      Todo.update(object[idProperty], object);
    });
    response.send();
  },

  onDestroy: function(request, response) {
    var idProperty = this.idProperty;

    request.objects.forEach(function(object) {
      Todo.destroy(object[idProperty]);
    });
    response.send();
  }

});

var port = process.env.PORT || 5000;
console.log('TodoMVC running on port', port);
app.listen(port);
