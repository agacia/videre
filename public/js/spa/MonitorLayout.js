define([
	"spa/templates",
	"spa/Map"
	],
	function(templates){
		var MonitorLayout = Backbone.Marionette.Layout.extend({
		  template: function(){
			return window.JST["monitorlayout.html"];
		  },
		  regions: {
		    map: ".map.container",
		    chart: ".chart.container"
		  }
		});
		return MonitorLayout;
	});