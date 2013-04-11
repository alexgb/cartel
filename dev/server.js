var Http = require('http'),
    fs = require('fs'),
    _ = require('underscore'),
    Syndicate = require ('../'),
    app;

app = Http.createServer(function(request, response) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      response.writeHead(500);
      return response.end('Error loading index.html');
    }

    response.writeHead(200);
    response.end(data);
  });
});


var data = [
  {"id": 1, "name": "Glenda Stevenson", "email": "randy@dawson.li"},
  {"id": 2, "name": "Caroline Lamb", "email": "peggy@weeks.il"},
  {"id": 3, "name": "Neil Herbert", "email": "michele@knight.fm"},
  {"id": 4, "name": "Matthew Kaplan", "email": "eugene@liu.edu"},
  {"id": 5, "name": "Joanna Summers", "email": "harriet@o.vg"},
  {"id": 6, "name": "Lori Sanchez", "email": "monica@hardin.cm"},
  {"id": 7, "name": "Ryan Woodward", "email": "danielle@parks.ve"},
  {"id": 8, "name": "Monica Hale", "email": "jeanette@anderson.er"},
  {"id": 9, "name": "Neil Bolton", "email": "warren@baker.ro"},
  {"id": 10, "name": "Kathy Nixon", "email": "jerome@moore.pa"}
];

function Record(data) {
  _.defaults(this, data);
}

Record.prototype.set = function(attribute, value) {
  this[attribute] = value;
  Record.triggerEvent('change', this);
};

Record.listeners = {};
Record.on = function(name, callback) {
  this.listeners[name] = this.listeners[name] || [];
  this.listeners[name].push(callback);
};

Record.off = function(name, callback) {
  var callbacks = this.listeners[name] || [],
      index = callbacks.indexOf(callback);

  if (index !== -1) {
    callbacks.splice(index, 1);
  }
};

Record.triggerEvent = function(name) {
  var args = Array.prototype.slice.call(arguments, 1, arguments.length);
  (this.listeners[name] || []).forEach(function(callback) {
    callback.apply(null, args);
  });
};



Syndicate.Controller.use(Syndicate.Informer);
Syndicate.Controller.define({
  resource: 'widgets',
  idProperty: 'id',

  actions: {
    read: 'onRead'
  },

  initialize: function() {
    var _this = this;

    Record.on('change', function(record) {
      _this.publish('update', record);
    });
  },

  onRead: function(request, response, ackCallback) {
    var nameParam = request.getParams().name;

    // filter results
    results = records.filter(function(row) {
      return row.name.toLowerCase().indexOf(nameParam.toLowerCase()) !== -1;
    });

    response.objects = results;
    ackCallback();
  }
});






var records = data.map(function(row) {
  return new Record(row);
});

// randomly change data
setInterval(function() {
  var record = records[_.random(0, records.length - 1)],
      chars = 'abcdefghijklmnopqrstuvwxyz'.split(''),
      emailSuffix = chars[_.random(0, chars.length-1)] + chars[_.random(0, chars.length-1)];

  record.set('email', record.email.replace(/(@.*)(\..*)$/, '$1.' + emailSuffix));
}, 2000);


// EO FAKE IT


Syndicate.createServer(app, {'log level': 2});
app.listen(5000);