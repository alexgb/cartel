var Store = require('./memory_store');


module.exports.create = function(options) {
  var model = new Store();

  model.name = options.name;
  return model;
};