define([
	"spa/templates"
	],
	function(templates){
		var Blank = Backbone.Marionette.ItemView.extend({
			template: function(){
				return window.JST["blank.html"];
			},
			ui: {
				title: ".title",
				message: ".message",
				details: ".details"
			},	
			initialize: function() { 
			},
			onShow: function() {
				$(this.ui.title).html(this.options.title);
				$(this.ui.message).html(this.options.message);
				$(this.ui.details).html(this.options.details);
			}
		});
		return Blank;
	});