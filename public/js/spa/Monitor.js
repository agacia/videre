define([
	"spa/templates"
	],
	function(templates){
		var Monitor = Backbone.Marionette.ItemView.extend({
			template: function(){
				return window.JST["monitor.html"];
			}
		});
		return Monitor;
	});