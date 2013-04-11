(function () {
  'use strict';


  Cartel.Model = Backbone.Model.extend({
    sync: function() {
      this.collection.sync.apply(this.collection, arguments);
    }
  });

})();