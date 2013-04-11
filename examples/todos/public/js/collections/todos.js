/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Todo Collection
	// ---------------

	// Cartel.Collection of todos, uses Cartel.Channel for
	// Collection.sync and handles incoming create, update, and
	// delete requests.
	var TodoList = Cartel.Collection.extend({
		resource: 'todos',

		// Reference to this collection's model.
		model: app.Todo,

		// Filter down the list of all todo items that are finished.
		completed: function () {
			return this.filter(function (todo) {
				return todo.get('completed');
			});
		},

		// Filter down the list to only todo items that are still not finished.
		remaining: function () {
			return this.without.apply(this, this.completed());
		},

		// We keep the Todos in sequential order, despite being saved by unordered
		// GUID in the database. This generates the next order number for new items.
		nextOrder: function () {
			if (!this.length) {
				return 1;
			}
			return this.last().get('order') + 1;
		},

		// Todos are sorted by their original insertion order.
		comparator: function (todo) {
			return todo.get('order');
		}
	});

	// Create our global collection of **Todos**.
	app.Todos = new TodoList();
})();
