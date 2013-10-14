define([
	"spa/templates"
	],
	function(templates){
		var Board = Backbone.Marionette.ItemView.extend({
			template: function(){
				return window.JST["board.html"];
			}
		});
		return Board;
	});