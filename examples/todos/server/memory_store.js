module.exports = Store;


function Store() {
  this.idCounter = 1;
  this.data = [];
}

Store.prototype.read = function(id) {
  for (var i = this.data.length - 1; i >= 0; i--) {
    if (this.data[i].id == id) {
      return clone(this.data[i]);
    }
  }
};

Store.prototype.create = function(attributes) {
  attributes = clone(attributes);
  attributes.id = this.idCounter++;
  this.data.push(attributes);
  return attributes;
};

Store.prototype.update = function(id, attributes) {
  for (var i = this.data.length - 1; i >= 0; i--) {
    if (this.data[i].id == id) {
      merge(this.data[i], attributes);
      return clone(this.data[i]);
    }
  }
};

Store.prototype.destroy = function(id) {
  for (var i = this.data.length - 1; i >= 0; i--) {
    if (this.data[i].id == id) {
      this.data.splice(i, 1);
      return;
    }
  }
};

Store.prototype.filter = function(filterFn) {
  return this.data.filter(filterFn);
};

Store.prototype.all = function() {
  return this.data;
};

Store.prototype.find = function(params) {
  return this.data.filter(function(record) {
    return Object.keys(params).every(function(property) {
      return record[property] === params[property];
    });
  });
};


// Utility functions
// .................


function clone(object) {
  var props = Object.keys(object),
      ret = {};

  for (var i = props.length - 1; i >= 0; i--) {
    ret[props[i]] = object[props[i]];
  }
  return ret;
}

function merge(objectA, objectB) {
  var props = Object.keys(objectB);

  for (var i = props.length - 1; i >= 0; i--) {
    objectA[props[i]] = objectB[props[i]];
  }
}

