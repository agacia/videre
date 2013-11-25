define([
	"spa/templates"
	],
	function(templates){
		var Map = Backbone.Marionette.ItemView.extend({
			initialize: function(){ // called when constructor new Map()
				this.project = this.options.project;
				this.mapId = "map_01";
			},
			template: function(){ // when clicked layout.show(...) 1
				return window.JST["map.html"];
			},
			onRender: function(){ // when clicked layout.show(...) 2
			},
			onShow: function(){ // when clicked layout.show(...) 3
				$(this.ui.map.selector).attr("id", this.mapId);
				this.initializeMap();
			},
			events:{
					// "change #pauseBtn": "pause"
					// "change #playerBtn": "pause",
					// "click #playerBtn": "pause",
					// "click #playLabel": "pause"
			},
			ui: {
				map: ".map_item"
				//routeselect: ".route_select span"
			},
			setOptions: function(options) {
				this.colorScale = options.colorScale;
			},
			initializeMap: function() {
				this.map = new L.Map(this.mapId);
				var layer = new L.StamenTileLayer("toner-lite");
				this.map.addLayer(layer);
				this.map.setView(new L.LatLng(this.project.scenario.y_center, this.project.scenario.x_center), this.project.scenario.zoom); 
				// ad d3 svg overlay
				this.initializePathsOverlay();
				this.initializeSensorsOverlay();
			},
			initializePathsOverlay: function() {
				var overlayPane = d3.select(this.map.getPanes().overlayPane);
				this.svgRoutes = overlayPane.append("svg");
				this.svgRoutes
					.attr('class','routes')
					.attr("width", $("#"+this.mapId).width())
					.attr("height", $("#"+this.mapId).height())
					.style("margin-left", "0px")
					.style("margin-top", "0px");
				 // show routes on the overlay
				for (var i in this.project.scenario.routes) {
					this.initializePaths(this.project.scenario.routes[i], null);
				}
				this.map.on("viewreset", this.reset, this);
				// this.reset();
			},
			initializeSensorsOverlay: function() {
				var overlayPane = d3.select(this.map.getPanes().overlayPane);
				this.svgSensors = overlayPane.append("svg");
				this.svgSensors
					.attr('class', 'sensors')
					.attr("width", $("#"+this.mapId).width())
					.attr("height", $("#"+this.mapId).height())
					.style("margin-left", "0px")
					.style("margin-top", "0px")
					
				// show routes on the overlay
				console.log("this.project.scenario.sensors", this.project.scenario.sensors)
				var that = this
				this.svgSensors.selectAll('.sensor')
					.data(function(d) {
						return that.project.scenario.sensors.map(function(a) {
							var point =  that.projection([a.display_position.point.lng,a.display_position.point.lat])
							var vds = 0;
							var hwy_name = "highway name"
							var hwy_dir = "highway dir" 
							for (var i in a.parameters.parameter) {
								var parameter = a.parameters.parameter[i]
								if (parameter.name == "vds") {
									vds  = parameter.value;
								}
								if (parameter.name == "hwy_name") {
									hwy_name  = parameter.value;
								}
								if (parameter.name == "hwy_dir") {
									hwy_dir  = parameter.value;
								}
							}
							return {
								x: point[0],
								y: point[1],
								id: a.id,
								type: a.type,
								linkId: a.link_reference.id,
								vds: vds,
								hwy_name: hwy_name,
								hwy_dir: hwy_dir
							};
						});
					})
					.enter()
						.append('circle')
						.attr('class', 'sensor')
						.attr("r", 5)
						.attr("cx", function(d) { return d.x; })
						.attr("cy", function(d) { return d.y} )	
						.attr("data-toggle", "tooltip")
						.attr("title", function(d) {
							var tooltipText = "Senspr " + d.type + " (id:" + d.id + "), vds: " + d.vds + ", place: " + d.hwy_name + ", " + d.hwy_dir;
							return tooltipText;
						});
				$(".sensor").tooltip({
					'container': 'body',
					'placement': 'bottom'
				});

				// this.map.on("viewreset", this.reset, this);
				// this.reset();
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
				this.svgRoutes.selectAll("g").remove();
			},
			updatePaths: function(currentTime) {
				// console.log("Map called to update paths");
				// this.clearPaths();
				for (var i in this.project.scenario.routes) {
				// 	this.initializePaths(this.project.scenario.routes[i], currentTime, null);
					var route = this.project.scenario.routes[i];
					// console.log("update route", route)
					var collection = {
						"type":"FeatureCollection", 
						"features": route.links, 
						"route_id": route.id
					};

					var feature = route.group.selectAll("path")
						.data(route.links).enter();

					var that = this;
					var feature = route.group.selectAll("path")
						.data(route.links)
						.style('stroke', function(d) {
							if (currentTime) {
								for (var i in d.performance) {
									if (d.performance[i]['timestamp'] == currentTime) {
										return that.colorScale(d.performance[i]['speed']);
									}
								}
							}
							return "green";
						});
				}

				this.reset();
			},
			initializePaths: function(route, currentTime, onclick) {
				var collection = {
					"type":"FeatureCollection", 
					"features": route.links, 
					"route_id": route.id
				};
				// create svg group  
				this.project.scenario.bottomLeft = null;
				this.project.scenario.topRight = null;
				route.bounds = d3.geo.bounds(collection);
				route.group = this.svgRoutes.append("g").attr("class", "leaflet-zoom-hide route").attr("id", collection.route_id);
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
					return Math.random()*10;
				});
				
				var that = this;
				feature.style('stroke', function(d) {
					if (currentTime) {
						var speed = Math.random()*40;
						return that.colorScale(speed);
					}
					return "green";
				})
				//this.map.on("viewreset", this.reset, this);
				this.reset();
			},
			reset: function() {
			  for (var i in this.project.scenario.routes) {
			    var bottomLeft = this.projection(this.project.scenario.bottomLeft),
			          topRight = this.projection(this.project.scenario.topRight);
			    this.svgRoutes.attr("width", topRight[0] - bottomLeft[0])
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
			  this.resetSensorsOverlay();
			},
			resetSensorsOverlay: function() {
				// var bounds = d3.geo.bounds(this.project.scenario.sensors)
			 //    console.log("sensors bounds", bounds)
			 //    var bottomLeft = bounds[0],
				// 	topRight = bounds[1];
				// if (this.svgSensors) {
			 //    	this.svgSensors.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
			 //    }
			 	var that = this
				d3.selectAll('.sensor')
					.data(function(d) {
						return that.project.scenario.sensors.map(function(a) {
							var point =  that.projection([a.display_position.point.lng,a.display_position.point.lat])
							return {
								x: point[0],
								y: point[1]
							};
						});
					})
					.attr("cx", function(d) { return d.x; })
					.attr("cy", function(d) { return d.y} )	
					
			}
		});	
		return Map;
	});