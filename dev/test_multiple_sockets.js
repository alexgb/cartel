var Http = require('http'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    assert = require('assert'),
    util = require('util'),
    _ = require('underscore');


// CONCLUSION:
// Can't have more than one sio that calls listen on app.
// Doing so breaks sockets. Thus bridge needs to accept io
// object so that it can be reused by client.

var sio = require('socket.io');

var app = Http.createServer(function(req, res) {
  fs.readFile(__dirname + '/test_multiple_sockets_index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
});

var io = sio.listen(app);

io.of('/ns1').on('connection', function(socket) {
  socket.emit('hi', 'connected to ns1');
});

console.log(app);

io.of('/ns2').on('connection', function(socket) {
  socket.emit('hi', 'connected to ns2');
});

app.listen(5000);
