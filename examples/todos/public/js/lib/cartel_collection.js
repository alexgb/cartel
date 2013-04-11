(function () {
  'use strict';


  Cartel.Collection = Backbone.Collection.extend({
    resource: null,

    initialize: function() {
      var collection = this;

      if (!this.resource) throw "Must define a resource name";

      this.channel = Cartel.Channel.define({
        debug: true,
        resource: this.resource,

        actions: {
          create: 'processCreate',
          update: 'processUpdate',
          delete: 'processDelete'
        },

        initialize: function() {
          this.pendingCreateResponses = 0;
        },

        processCreate: function(message) {
          if (this.pendingCreateResponses === 0) {
            collection.add(message.objects);
          }
        },

        processUpdate: function(message) {
          // TODO : could be updated to use new backbone Collection#set
          // collection.set(message.objects, {add: false, remove: false});
          for (var i = message.objects.length - 1; i >= 0; i--) {
            var object = message.objects[i],
                model = collection.get(object[this.idProperty]);

            if (model) model.set(object);
          }
        },
        processDelete: function(message) {
          for (var i = message.objects.length - 1; i >= 0; i--) {
            var object = message.objects[i],
                model = collection.get(object[this.idProperty]);

            if (model) collection.remove(model);
          }
        }
      });
    },

    sync: function(method, model, options) {
      var channel = this.channel;

      if (method === "read") {
        channel.read(options.data, handleResponse);
      }
      else {
        if (!channel[method]) throw "Method '" + method + "' not supported by channel";
        channel[method]([model.attributes], handleResponse);
      }

      // Track pending create requests so that we don't create
      // model twice from create event.
      if (method === "create") channel.pendingCreateResponses++;

      function handleResponse(response) {
        if (method === "create") channel.pendingCreateResponses--;
        if (response.error()) {
          if (options.error) {
            options.error(model, response, options);
          }
          model.trigger('error', model, response, options);
        }
        else {
          // Backbone expects an array on fetch and object on other actions
          var data = method === "read" ? response.objects : response.objects[0];
          if (options.success) {
            options.success(model, data, options);
          }
          model.trigger('sync', model, data, options);
        }
      }
    }
  });

})();
