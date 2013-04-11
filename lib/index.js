module.exports = require('./server');
module.exports.Channel = require('./channel_controller');

module.exports.strategies = {};
module.exports.strategies.Informer = require('./strategies/informer');
module.exports.strategies.Pusher = require('./strategies/pusher');
module.exports.strategies.Prophet = require('./strategies/prophet');