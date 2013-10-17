define([
	"spa/templates"
	],
	function(templates){
		var RealtimeLayout = Backbone.Marionette.Layout.extend({
		  template: function(){
			return window.JST["realtimelayout.html"];
		  },
		  regions: {
		    map: ".map.container",
		    chart: ".chart.container"
		  }
		});
		return RealtimeLayout;
	});