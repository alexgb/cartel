/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Router
	// ----------
	var Workspace = Backbone.Router.extend({
		routes: {
			'' : 'goToRandomRoom',
			':room/' : 'setupRoom',
			':room/:filter' : 'setFilter'
		},

		goToRandomRoom: function() {
			var random = Math.random().toString(36).substring(7);
			this.navigate(random + '/', {trigger: true});
		},

		setupRoom: function(room) {
			// Set the current room name
			app.TodoRoom = room;

			// Subscribe to room through channel
			app.Todos.channel.send({
				headers: { action: 'subscribe' },
				objects: [],
				meta: { property: 'room', match: room }
			});
		},

		setFilter: function (room, filter) {
			this.setupRoom(room);

			// Set the current filter to be used
			app.TodoFilter = filter.trim() || '';

			// Trigger a collection filter event, causing hiding/unhiding
			// of Todo view items
			app.Todos.trigger('filter');
		}
	});

	app.TodoRouter = new Workspace();
	Backbone.history.start({pushState: true});
})();
