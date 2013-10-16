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
				console.log("initialize Map ItemView", this.app.scenario);
			},
			events:{
			},
			ui: {
				map: "#map"
			},
			onShow: function(){
				console.log("show Map ItemView");
				this.mapId = "map_01";
				$(".map_item").attr("id", this.mapId);

				this.initializeMap();
			},
			initializeMap: function() {
				this.map = new L.Map(this.mapId);
				var layer = new L.StamenTileLayer("toner-lite");
				// var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 2, maxZoom: 16, attribution: 'Map data © OpenStreetMap contributors'}); 
				this.map.addLayer(layer);
				this.map.setView(new L.LatLng(34.1326, -117.9338),11); 
				// ad d3 svg overlay
				var overlayPane = d3.select(this.map.getPanes().overlayPane);
				this.svg = overlayPane.append("svg");
				this.svg
					.attr("width", $("#"+this.mapId).width())
					.attr("height", $("#"+this.mapId).height())
					.style("margin-left", "0px")
					.style("margin-top", "0px");
			}
		});	
		return Map;
	});