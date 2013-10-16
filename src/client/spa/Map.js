define([
	"spa/templates"
	],
	function(templates){
		var Map = Backbone.Marionette.ItemView.extend({
			template: function(){
				return window.JST["map.html"];
			},
			initialize: function(){
				this.app = this.options.app;
			},
			events:{
			},
			ui: {
				map: "map"
			},
			onShow: function(){
				this.initializeMap();
			},
			initializeMap: function() {
				console.log("initialize map for scenario" , this.app.scenario);
				var map = new L.Map("map");
				var layer = new L.StamenTileLayer("toner-lite");
				// var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 2, maxZoom: 16, attribution: 'Map data © OpenStreetMap contributors'}); 
				map.addLayer(layer);
				map.setView(new L.LatLng(34.1326, -117.9338),11); 
			}
		});	
		return Map;
	});