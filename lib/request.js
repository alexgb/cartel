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
