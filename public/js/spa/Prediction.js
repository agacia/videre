define([
	"spa/templates"
	],
	function(templates){
		var Prediction = Backbone.Marionette.ItemView.extend({
			template: function(){
				return window.JST["prediction.html"];
			}
		});
		return Prediction;
	});