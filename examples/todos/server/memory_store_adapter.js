
module.exports = function(model) {
  return function(controller) {

    controller.resource = model.name;

    wrapMethod(model, 'create', null, function(result) {
      controller.publish('create', result);
    });

    wrapMethod(model, 'update', null, function(result) {
      controller.publish('update', result);
    });

    wrapMethod(model, 'destroy', function(id) {
      return model.read(id);
    }, function(preResult, result) {
      controller.publish('delete', preResult);
    });

  };
};


function wrapMethod(object, methodName, beforeFn, afterFn) {
  var previous = object[methodName];

  object[methodName] = function() {
    var args = Array.prototype.slice.call(arguments, 0),
        beforeResult, result;

    if (beforeFn) {
      beforeResult = beforeFn.apply(null, args);
    }

    result = previous.apply(object, arguments);

    if (afterFn) {
      args.unshift(result);
      if (beforeResult) args.unshift(beforeResult);
      afterFn.apply(null, args);
    }

    return result;
  };
}
