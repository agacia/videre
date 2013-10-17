define([
	"spa/templates"
	],
	function(templates){
		var Map = Backbone.Marionette.ItemView.extend({
			initialize: function(){ // called when constructor new Map()
				this.project = this.options.project;
				this.timerDelay = 1000;
				this.mapId = "map_01";
				console.log("Map.this", this);
			},
			template: function(){ // when clicked layout.show(...) 1
				return window.JST["map.html"];
			},
			onRender: function(){ // when clicked layout.show(...) 2
			},
			onShow: function(){ // when clicked layout.show(...) 3
				$(this.ui.map.selector).attr("id", this.mapId);
				var that = this;
				$(this.ui.playbtn.selector).on('change', function(e) {
					// console.log("play playbtn checked", $(that.ui.playbtn.selector)[0].checked);
					// console.log("play pause checked",  $(that.ui.pausebtn.selector)[0].checked);
					// play only if not played yet
					if ($(that.ui.playbtn.selector)[0].checked) { // true if change of play button to check
						that.play();
					}
				});
				$('#pauseBtn').on('change', function(e) {
					that.pause();
				});

				this.initializeMap();
				// if (this.timer) {
				// 	clearTimeout(this.timer);
				// }
				// this.play();
			},
			onBeforeClose: function(){ // not called
				console.log("onBeforeClose");
			},
			events:{
				// "change #pauseBtn": "pause"
				// "change #playerBtn": "pause",
				// "click #playerBtn": "pause",
				// "click #playLabel": "pause"
			},
			ui: {
				map: ".map_item",
				clock: ".clock",
				playbtn: "#playBtn",
				pausebtn: "#pauseBtn"
			},
			initializeMap: function() {
				this.map = new L.Map(this.mapId);
				var layer = new L.StamenTileLayer("toner-lite");
				this.map.addLayer(layer);
				this.map.setView(new L.LatLng(this.project.scenario.y_center, this.project.scenario.x_center), this.project.scenario.zoom); 
				// ad d3 svg overlay
				this.showPathsOverlay();
			},
			showPathsOverlay: function() {
				var overlayPane = d3.select(this.map.getPanes().overlayPane);
				this.svg = overlayPane.append("svg");
				this.svg
					.attr("width", $("#"+this.mapId).width())
					.attr("height", $("#"+this.mapId).height())
					.style("margin-left", "0px")
					.style("margin-top", "0px");
				 // show routes on the overlay
				for (var i in this.project.scenario.routes) {
					var routeCollection = {
						"type":"FeatureCollection", 
						"features": this.project.scenario.routes[i].links, 
						"route_id": this.project.scenario.routes[i].id
					};
					this.showPaths(this.project.scenario.routes[i], routeCollection, null);
				}
				this.map.on("viewreset", this.reset, this);
				this.reset();
			},
			switchCoords: function(x) {
				return [x[1],x[0]];
			},
			switchFeatures: function(feature) {
				feature.geometry.coordinates = feature.geometry.coordinates.map(switchCoords);
				return feature;
			},
			projection: function(x) {
				// x = [lat, lng]
				var latlng = new L.LatLng(x[1], x[0]);
				var point = this.map.latLngToLayerPoint(latlng);
				return [point.x, point.y];
			},
			clearPaths: function() {
				this.svg.selectAll("g").remove();
			},
			showPaths: function(route, collection, onclick) {
				// create svg group  
				this.project.scenario.bottomLeft = null;
				this.project.scenario.topRight = null;
				route.bounds = d3.geo.bounds(collection);
				route.group = this.svg.append("g").attr("class", "leaflet-zoom-hide route").attr("id", collection.route_id);
				var bottomLeft = this.projection(route.bounds[0]);
				var topRight = this.projection(route.bounds[1]);
				if (this.project.scenario.bottomLeft === null) {
					this.project.scenario.bottomLeft = route.bounds[0];
					this.project.scenario.topRight = route.bounds[1];
				}
				if (bottomLeft[0] < this.projection(this.project.scenario.bottomLeft)[0]) {
					this.project.scenario.bottomLeft[0] = route.bounds[0][0];
				}
				if (bottomLeft[1] < this.projection(this.project.scenario.bottomLeft)[1]) {
					this.project.scenario.bottomLeft[1] = route.bounds[0][1];
				}
				if (topRight[0] > this.projection(this.project.scenario.topRight)[0]) {
					this.project.scenario.topRight[0] = route.bounds[1][0];
				}
				if (topRight[1] > this.projection(this.project.scenario.topRight)[1]) {
					this.project.scenario.topRight[1] = route.bounds[1][1];
				}
				var that = this;
				route.path = d3.geo.path().projection(function(x) {
					return that.projection(x);
				});  
				var feature = route.group.selectAll("path")
					.data(collection.features)
					.enter().append("path");
				feature.attr("d", route.path);
				feature.attr("route_id", collection.route_id);
				// events
				// mousedown: Triggered by an element when a mouse button is pressed down over it
				// mouseup: Triggered by an element when a mouse button is released over it
				// mouseover: Triggered by an element when the mouse comes over it
				// mouseout: Triggered by an element when the mouse goes out of it
				// mousemove: Triggered by an element on every mouse move over it.
				// click: Triggered by a mouse click: mousedown and then mouseup over an element
				// contextmenu: Triggered by a right-button mouse click over an element.
				// dblclick: Triggered by two clicks within a short time over an element
				feature.on("mouseover", function(d) {
					d3.select("g#"+collection.route_id).selectAll("path").classed("hover", true)
					// console.log("hover " + collection.route_id)
				});
				feature.on("mouseout", function(d) {
					d3.select("g#"+collection.route_id).selectAll("path").classed("hover", false)
				});
				feature.on("click", function(d) {
					//onclick(d, collection.route_id);]
				});
				// custom tooltips
				//var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
				// feature.on("mouseover", function(d) {    
				//           div.transition()        
				//               .duration(200)      
				//               .style("opacity", .9);      
				//           div .html("over link " + "<br/>"  + d.properties.id)  
				//               .style("left", (d3.event.pageX) + "px")     
				//               .style("top", (d3.event.pageY - 28) + "px");  
				//       })                  
				//       .on("mouseout", function(d) {       
				//           div.transition()        
				//               .duration(500)      
				//               .style("opacity", 0);   
				//       });
				// twitter bootsrap tooltip
				feature.attr("data-toggle", "tooltip");
				feature.attr("title", function(d) {
					var tooltipText = "Route " + collection.route_id;
					tooltipText += "\nlink: " +  d.properties.id + ", type: " + d.properties.type + ", offset: " + d.properties.offset + ", length: " + d.properties.length;
					if (d.performance) {
						tooltipText += "\nspeed: " + d.performance.data.speed;
						tooltipText += "\nflow: " + d.performance.data.flow;
						tooltipText += "\ndensity: " + d.performance.data.density;
					}
					return tooltipText;
				});
				$("path").tooltip({
					'container': 'body',
					'placement': 'bottom'
				});
				feature.style('stroke-width', function(d) {
					if (d.performance) { 
						return d.performance.speed;
					}
				});
				feature.style('stroke', function(d) {
					if (d.performance) { 
						// todo read linktype and free-flow-speed/speed limit 
						var color =  "green";
						// freeway - free-flow-speed - 45mph - 25% - 10%
						// others  - speed limit - 50% - 25% - 10%
						// todo gradient
						var speed = d.performance.speed;
						var freeFlowSpeed = 80;
						var linkType = "freeway";
						if (speed < 0.1 * freeFlowSpeed) {
							color = "black";
						}
						if (speed < 0.25 * freeFlowSpeed) {
							color = "red";
						}
						if ( (linkType == "freeway" && speed < 45) || (linkType != "freeway" && speed < 0.5 * freeFlowSpeed)) {
							color = "yellow";
						}
						// console.log('color', color)
						return color;
					}
				})
				//this.map.on("viewreset", this.reset, this);
				//this.reset();
			},
			reset: function() {
			  for (var i in this.project.scenario.routes) {
			    var bottomLeft = this.projection(this.project.scenario.bottomLeft),
			          topRight = this.projection(this.project.scenario.topRight);
			    this.svg.attr("width", topRight[0] - bottomLeft[0])
			          .attr("height", bottomLeft[1] - topRight[1])
			          .style("margin-left", bottomLeft[0] + "px")
			          .style("margin-top", topRight[1] + "px");
			    if (this.project.scenario.routes[i].bounds) {
				    var bounds = this.project.scenario.routes[i].bounds;
				    var bottomLeft = this.projection(bounds[0]),
				          topRight = this.projection(bounds[1]);
				    this.project.scenario.routes[i].group.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
				    this.project.scenario.routes[i].group.selectAll("path").attr("d", this.project.scenario.routes[i].path); 
				} 
			  }
			},
			updateClock: function() {
				var date = new Date();
				$(this.ui.clock.selector).text(date.getDate()  + "/" + (date.getMonth()+1) + "/" + date.getFullYear() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
			},
    		play: function() {
			console.log("play");
			var that = this;
    			this.timer = setTimeout(function() {
    				that.updateClock();
    				that.play();
    			}, this.timerDelay);
			
    		},
    		pause: function() {
    			console.log("pause");
				if (this.timer) {
					clearTimeout(this.timer);
				}
    		}
		});	
		return Map;
	});