define([
	"spa/templates"
	],
	function(templates){
		var Blank = Backbone.Marionette.ItemView.extend({
			template: function(){
				return window.JST["blank.html"];
			},
			ui: {
				title: ".message .title",
				details: ".message .details"
			},	
			initialize: function() { 
			},
			onShow: function() {
				$(this.ui.title).html(this.options.message.title);
				$(this.ui.details).html(this.options.message.details);
			}
		});
		return Blank;
	});