define([
	"spa/templates",
	"spa/Map"
	],
	function(templates, Map){
		var MonitorLayout = Backbone.Marionette.Layout.extend({
			template: function(){
				return window.JST["monitorlayout.html"];
			},
			regions: {
				map: ".map",
				chart: ".chart"
			},
			ui: {
				message: "div.message",
				// calender: ".calender",
				clock: ".clock",
				playbtn: ".playBtn",
				pausebtn: ".pauseBtn",
				availabledate: ".select.availabledate",
				btnload: ".btn.load",
				slider: "#slider",
				contourplot: ".contourplot",
				eventsfeed: ".events-feed",
				eventel: ".event",
				timebrush: ".timebrush"
			},
			events: {
				"submit": "load",
				"click .btn.predict": "goPredict",
				"click .btn.addEvent": "showAddEvent",
				"click .window .btn.close": "hideAddEvent"
				// "change .select.availabledate": "onChangeAvailableDate"
			},
			initialize: function(){
				this.app = this.options.app; 
				this.timerDelay = 600; // granurality of the simulation - for slider (every 10 minutes)
				this.simulationStep = 1000; // miliseconds
				var now = new Date();
				this.currentTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
				this.startTime = this.currentTime;
				this.endTime - this.startTime;
				this.performanceByTime = null;
				this.timeBrushWidth = 0;
			    this.timeBrushHeight = 0;
				// if performance is already loaded	
				if (this.app.selectedProject.performance) {
					// todo show the loaded performance
				} 
				
			},
			onShow: function() { 
				this.contourPlotOptions = {
					"class" : this.ui.contourplot.selector,
					"width": 500,
					"height": 300,
					"margin": {
						"top": 0,
						"left": 30,
						"bottom": 30,
						"right": 0
					},
					"scale" : {
						"speed": d3.scale.linear().domain([0, 32]).range(['red', 'green']),
						"flow": d3.scale.linear().domain([0, 0.1]).range([2, 16]),
						"density": d3.scale.linear().domain([0, 1]).range([0, 1])
					},
					"domain": {
						"speed": [0,32],
						"flow": [0, 0.1],
						"density": [0, 1]
					}
				}
				this.metrics = ["speed", "flow", "density"];
				// show map with routes (without performance)
				this.mapViewItem = new Map({project: this.app.selectedProject});
				this.map.show(this.mapViewItem);
				this.mapViewItem.setOptions(this.contourPlotOptions)
				this.initialiseDateSelection();
				this.initializeOverlaySelection();
				this.initializeRouteSelection();
				this.initializeRouteSelectionForCharts();
				this.initialiseSlider(0,0,1,1);
			},
			initialiseDateSelection: function() {
				var that = this;
				$(this.ui.playbtn.selector).parent().addClass('disabled');
				$(this.ui.pausebtn.selector).parent().addClass('disabled');
				$(this.ui.playbtn.selector).on('change', function(e) {
					if ($(that.ui.playbtn.selector)[0].checked) { // true if change of play button to check
						that.play();
					}
				});
				$('.pauseBtn').on('change', function(e) {
					that.pause();
				});
				var dates = this.app.selectedProject.scenario.realtime;
				d3.select(this.ui.availabledate.selector).selectAll("option").remove();
				d3.select(this.ui.availabledate.selector).selectAll("option")
					.data(dates).enter().append("option")
					.text(function(d) {
						var date = d.date.slice(0,10);
						return date;
					})
					.attr("value", function(d) {
						return d.date;
					});
				// select the first element from tle list
				if (dates.length > 0) {
					var that = this;
					$(this.ui.availabledate.selector).on('change', function(e) {
						that.onChangeAvailableDate();
					});
					$(this.ui.availabledate.selector).val(dates[0].date).change();
					this.onChangeAvailableDate(dates[0].date);
					if (!this.app.selectedProject.performance) {
						this.load();
					}
				}
			},
			load: function(e){
				if (e) e.preventDefault();
				$(this.ui.btnload.selector).button('loading');
				var that = this;
				this.app.loadData(
					this.app.selectedProject.projectname,
					this.app.selectedProject.scenario.name,
					this.getDateName(this.currentTime),
					function(err) {
						that.ui.message.html(err);
					},
					function(data) {
						if (data) {
							that.ui.message.html("Data loaded! Interact with the map and charts.");	
							$(that.ui.btnload.selector).button('reset');
							$(that.ui.playbtn.selector).parent().removeClass('disabled');
							$(that.ui.pausebtn.selector).parent().removeClass('disabled');
							if (data.events) {
								// that.gotEventsData(data.events);
							}
							if (data.performance) {
								that.gotPerformanceData(data.performance);
							}
						}
						else {
							that.ui.message.html("Empty data!");
							$(that.ui.btnload.selector).button('reset');
						}
					});
			},
			readPerformanceForRoutes: function(routes, performance) {
				var performanceByLink = performance.dimension(function(d) { 
					var ddate = new Date(d.date); // ! save datetime in the correct timezone
					d.date = ddate;
					d.id = parseInt(d.id);
					return d.id; 
				});
				var linkPerformance = performanceByLink.bottom(Infinity); // ascending order
				for (var routeId in routes) {
					routes[routeId].performanceData = [];
					var route = routes[routeId];
					for (var linkId in route.links) {
						var link = route.links[linkId];
						link.performance = performanceByLink.filter(link.properties.id).top(Infinity);
					}
				}
				var currentId = null;
				for (var i in linkPerformance) {
					if (linkPerformance[i].id != currentId) {
						currentId = linkPerformance[i].id;
						for (var routeId in routes) {
							routes[routeId].inRoute = routes[routeId].linkIds.indexOf(currentId) != -1;
						}
					}
					for (var routeId in routes) {
						if (routes[routeId].inRoute) {
							routes[routeId].performanceData.push(linkPerformance[i]);
						}
					}
				}
			},
			gotPerformanceData: function(data) {
				if (!data || data.length < 1) {
					console.log("Empty performance data");
					return;
				}
				var cf = crossfilter(data);
				var routes = this.app.selectedProject.scenario.routes;
				
				// get performance for each route 
				this.readPerformanceForRoutes(routes, cf);
				console.log("routes with performanceData and link's performance", routes);
				for (var routeId in routes) {
					var route = routes[routeId];
					var currentLink = null;
					route.performanceData.forEach(function (d) {
			            if (!currentLink || currentLink.properties.id != d.id) {
			            	currentLink = route.links[route.linkIds.indexOf(d.id)]
			            }
			            d.offset = currentLink ? currentLink.properties.offset : 0;
			        });
					route.cf = crossfilter(route.performanceData);
					route.performanceByTime = route.cf.dimension(function(d) { 
						var ddate = new Date(d.date); // ! save datetime in the correct timezone
						d.date = ddate;
						return d.date; 
					});
					route.performanceByLink = route.cf.dimension(function(d) { 
						var ddate = new Date(d.date); // ! save datetime in the correct timezone
						d.date = ddate;
						return d.id; 
					});
				}
				// get domain range for metrics
				// var dimensions = {}
				// for (var i in this.metrics) {
				// 	var metric = this.metrics[i];
				// 	dimensions[metric] = cf.dimension(function(d) { return d[metric]; });
				// 	// var min = d3.min(values, function(d) { return d.value[metric]; });
		  //  			// var max = d3.max(values, function(d) { return d.value[metric]; });
		  //  			var max = dimensions[metric].top(1)[0];
		  //       	this.contourPlotOptions.domain[metric] = [0, max[metric]];
				// }
				// group performance by time for the whole network 
				this.performanceByTime = cf.dimension(function(d) { 
					var ddate = new Date(d.date); // ! save datetime in the correct timezone
					d.date = ddate;
					return d.date; 
				});
				var timeGroup = this.performanceByTime.group();
				var metric = "speed";
				timeGroup.reduce(
					function(p,v) { // add
						++p.count;
						p.sum += v[metric]
						return p;
					},
					function(p,v) { // remove
						--p.count;
						p.sum -= v[metric];
						return p;
					},
					function() { // init
						return { count: 0, sum: 0 };
					}
				)
				var timeSteps = timeGroup.all();
				timeSteps.forEach(function(d) {
				    d.value = d.value.count == 0 ? 0 : d.value.sum / d.value.count;
				});

				if (timeSteps.length < 2) {
					console.log("Not enough of performance data is available! Loaded time steps:" , timeSteps.length)
					return;
				}
				// read the time range and time step
				this.startTime = timeSteps[0].key;
				this.endTime = timeSteps[timeSteps.length-1].key;
				
				// set slider and clock for the first time
				this.initialiseSlider(this.startTime.valueOf(), this.startTime.valueOf(), this.endTime.valueOf(), this.simulationStep * this.timerDelay); // todo lastSimulation step 
				this.currentTime = this.startTime;
				this.onTimeChange(this.currentTime);
				
				d3.select(".time-series").selectAll("*").remove();
				this.createTimeSeries(".time-series", timeSteps);

				for (var routeId in routes) {
					var countourplotClass = routes[routeId].id;
					d3.select("#heatmaps").append("div").attr("class", countourplotClass);
					this.createCountourPlot(countourplotClass, routes[routeId].performanceData, 600, 400);
				}
			},
			createCountourPlot: function(selector, data, width, height) {
    			var chartGroup = "chartGroup";
   				var dateFormat = d3.time.format("%H:%M");
		        var cf = crossfilter(data);
		        data.forEach(function (d) {
		            d.hour = (new Date(d.date)).getHours(); // pre-calculate month for better performance
		            d.mile = Math.floor(d.offset)
		        });
			    // timeOfLinkDimension = cf.dimension(function(d) { return [+d.hour, +d.id]; });
			    timeOfLinkDimension = cf.dimension(function(d) { return [d.hour, d.mile]; });
	            var valueByTimeOfLinkGroup = timeOfLinkDimension.group().reduce(
	                function (p, v) {
	                    ++p.count;
	                    p.sumSpeed += v.speed;
	                    p.sumDensity += v.density;
	                    p.sumFlow += v.flow;
	                    return p;
	                },
	                function (p, v) {
	                    --p.count; 
	                    p.sumSpeed -= v.speed;
	                    p.sumDensity -= v.density;
	                    p.sumFlow -= v.flow;
	                    return p;
	                },
	                function () {
	                    return {count: 0, sumSpeed: 0, sumDensity: 0, sumFlow: 0};
	                }
	            );
	            var values = valueByTimeOfLinkGroup.top(Infinity)
	            values.forEach(function(d) {
	            	d.value.speed = d.value.sumSpeed / d.value.count;
	            	d.value.density = d.value.sumDensity / d.value.count;
	            	d.value.flow = d.value.sumFlow / d.value.count;
	            });

		        var that = this;
		        var heatmapCharts = {};
		        var barCharts = {};
		        var heatColorMappings = {};
		        d3.select("."+selector).selectAll("*").remove();
		        for (var i in this.metrics) {
		        	var metric = this.metrics[i];
		   			var max = d3.max(values, function(d) { return d.value[metric]; });
		   			var countourplotClass = "heatmap_"+metric;
			        d3.select("."+selector)
			        	.append("h3").html(metric)
			        	.append("div").attr("class",countourplotClass);
			        heatmapCharts[metric] = dc.heatMap("."+countourplotClass, chartGroup);
					heatColorMappings[metric] = function(d) {
		                return d3.scale.linear().domain([0, max]).range(['red', 'green'])(d);    
			        };
			        heatColorMappings[metric].domain = function() {
			        	return [0,max];
			        };
			        heatmapCharts[metric]
		                .width(width)
		                .height(height)
		                .dimension(timeOfLinkDimension)
		                .group(valueByTimeOfLinkGroup)
		                .keyAccessor(function(d) { return +d.key[0]; })
		                .valueAccessor(function(d) { return +d.key[1]; })
		                .colorAccessor(function(d) { return +d.value[metric]; })
		                .title(function(d) {
		                    return " Hour:   " + d.key[0] + "\n" +
		                           "  Link:   " + d.key[1] + "\n" +
		                           metric +":   " + d.value[metric];})
		                .colors(heatColorMappings[metric])
		                .calculateColorDomain();

			        heatmapCharts[metric].render();
			        this.timeBrushWidth = width - heatmapCharts[metric].margins().left - heatmapCharts[metric].margins().right;
			        this.timeBrushHeight = height - heatmapCharts[metric].margins().top - heatmapCharts[metric].margins().bottom;
    				var timebrush = d3.select("."+countourplotClass+" g.heatmap")
						.append("g")
						.attr('class', 'gtimebrush')
						.attr('width', this.timeBrushWidth)
						.attr('height', this.timeBrushHeight)
	    				.attr('transform', 'translate(0, ' + (0) + ')')
					timebrush.append('rect')
						.attr('class', 'brush-handle')
						.attr("width", 1)
						.attr("height", this.timeBrushHeight)
						.attr("x", 0)
						.attr("y", 0);	
					timebrush.append('rect')
						.attr('class', 'brush-axis')
						.attr("width", this.timeBrushWidth)
						.attr("height", 2);
		        }

		        // var hourlyDimension = cf.dimension(function (d) { return +d.hour; });
		        // var speedByHourGroup = hourlyDimension.group().reduce(
		        //     function(p,v) {
		        //         return p + v.speed;
		        //     },
		        //     function(p,v) {
		        //         return p - v.speed;
		        //     },
		        //     function() {
		        //         return 0;
		        //     }
		        // );
		        // barChart
		        //         .dimension(hourlyDimension)
		        //         .group(speedByHourGroup)
		        //         .width(600)
		        //         .height(200)
		        //         .y(d3.scale.linear().domain([-10.0,100.0]))
		        //         .x(d3.scale.linear().domain([-0.5,11.5]))
		        //         .elasticY(true)
		        //         .centerBar(true);
		        // barChart.render();
		    

				// var zoomableCP = new this.zoomableCountourPlot();
				// d3.select(".countourplots").append("div")
				// 	.attr("class", selector)
				// 	.call(zoomableCP);
				// zoomableCP.setData(data);
			},
			createTimeSeries: function(selector, data) {
				var zoomableTS = new this.zoomableTimeSeries();
				d3.select(selector).call(zoomableTS);
				zoomableTS.setData(data);
			},
			// ui 
			showAddEvent: function() {
				$(".newEvent.window").show();
			},
			hideAddEvent: function() {
				$(".newEvent.window").hide();
			},
			onChangeAvailableDate: function(date) {
				this.pause();
				var date = new Date($(this.ui.availabledate.selector+" option:selected" ).val());
				// this.datepicker.data('datepicker').setValue(date);
				this.onChangeDate(date);
			},
			onChangeDate: function(date) {   
				this.currentTime = date;
				this.ui.message.html("Click the button Load to load data for the selected date " + date );
				$(this.ui.playbtn.selector).parent().removeClass('disabled');
				$(this.ui.pausebtn.selector).parent().removeClass('disabled');
				this.onTimeChange(this.currentTime);
			},
			getDateName: function(date) {
				// todo
				// Heroku:  Tue Jul 16 2013 17:00:00 GMT-0700 (PDT)
				// Local: Wed Jul 17 2013 00:00:00 GMT-0700 (PDT)  -> date:  20130717 
				// var day = date.getDate() + 1 // fix on heroku
				var day = date.getDate() 
				day = day < 10 ? '0'+day : day;
				var month = +date.getMonth() + 1;
				month = date.getMonth() < 10 ? '0'+month : month;
				var dateFolder = date.getFullYear()+month+day;
				return dateFolder;
			},
			initializeRouteSelection: function() {
				// populates checkboxes with route names
				var routeSelect = d3.select(".route_routesn span");
				// console.log("routeselect", routeSelect, "this.app.selectedProject.scenario.routes;", this.app.selectedProject.scenario.routes);
				routeSelect.selectAll("label").remove();
				routeSelect.selectAll("input").remove();
				routeSelect.selectAll("input")
					.data(this.app.selectedProject.scenario.routes).enter()
					.append('label')
					.attr('for',function(d,i){ return d.id; })
					.text(function(d) { return d.name; })
					.append("input")
					.attr("checked", true)
					.attr("type", "checkbox")
					.attr("id", function(d,i) { return d.id; })
					.on("click", function() {
						var ele = $(this);
						var routeId = ele.attr("id");
						if (ele.is(':checked')){
							ele.attr('checked', true);
							d3.select("g#"+routeId).style("display","block");
							// d3.select(".contourplot."+routeId).style("display","block");
						}
						else {
							ele.attr('checked', false);
							d3.select("g#"+routeId).style("display","none");
							// d3.select(".contourplot."+routeId).style("display","none");
						}
					});	
			},
			initializeRouteSelectionForCharts: function() {
				// populates checkboxes with route names
				var routeSelect = d3.select(".route_selection_charts span");
				routeSelect.selectAll("label").remove();
				routeSelect.selectAll("input").remove();
				routeSelect.selectAll("input")
					.data(this.app.selectedProject.scenario.routes).enter()
					.append('label')
					.attr('for',function(d,i){ return d.id; })
					.text(function(d) { return d.name; })
					.append("input")
					.attr("checked", true)
					.attr("type", "checkbox")
					.attr("id", function(d,i) { return d.id; })
					.on("click", function() {
						var ele = $(this);
						var routeId = ele.attr("id");
						if (ele.is(':checked')){
							ele.attr('checked', true);
							d3.select("#heatmaps ."+routeId).style("display","block");
						}
						else {
							ele.attr('checked', false);
							d3.select("#heatmaps ."+routeId).style("display","none");
						}
					});	
			},
			initializeOverlaySelection: function() {
				// populates checkboxes with route names
				var overlays = ["routes", "sensors"]
				var overlaySelect = d3.select(".overlay_selection span");
				overlaySelect.selectAll("label").remove();
				overlaySelect.selectAll("input").remove();
				overlaySelect.selectAll("input")
					.data(overlays)
					.enter()
						.append('label')
						.attr('for',function(d,i){ return d; })
						.text(function(d) { return d; })
						.append("input")
						.attr("checked", true)
						.attr("type", "checkbox")
						.attr("id", function(d,i) { return d; })
						.on("click", function() {
							var ele = $(this);
							var overlay = ele.attr("id");
							if (ele.is(':checked')){
								ele.attr('checked', true);
								d3.select("."+overlay).style("display","block");
							}
							else {
								ele.attr('checked', false);
								d3.select("."+overlay).style("display","none");
							}
						});
			},
			goPredict: function(e) {
				e.preventDefault
				this.app.showPrediction();
			},
			gotEventsData: function(data) {
				if (!(this.dateName in this.loadedDates)) {
					this.loadedDates[this.dateName] = {}
				}
				this.loadedDates[this.dateName].events = this.sortByTimestamp(data);
				this.udpateEventFeed();
			},
			udpateEventFeed: function() {
				var currentEvents = []
				for (var i in this.loadedDates[this.dateName].events) {
					var eventData = this.loadedDates[this.dateName].events[i]
					if (eventData['timestamp'] == this.currentTime) {
						d3.select('.event-timestamp')
							.text(eventData['timestamp'])
						currentEvents = eventData['data']
						break;
					}
				}
				if (currentEvents.length > 0) {
					d3.select(this.ui.eventsfeed.selector).selectAll(this.ui.eventel.selector)
						.data(currentEvents)
						.enter()
							.append('div')
							.attr('class','event')
							.append('span')
					d3.selectAll(this.ui.eventel.selector)
						.data(currentEvents)
						.text(function(d) { return 'Event: ' + d })
				}
			},
			initialiseSlider: function(value, min, max, step) {
				// console.log(value, min, max, step)
				if (this.slider) {  
					d3.select(".slider").remove(); 
				   	$("#slider-wrapper").append("<div id='slider'></div>");
				}
				var options = {
					"min": min, 
					"max" : max, 
					"step": step,
					"formater": function(v) {
						var format = d3.time.format("%H:%M");
						return "Current time "+ format(new Date(v));
					}
				}
				var that = this;
			    this.slider = $(this.ui.slider.selector)
			    	.slider(options)
				    .slider('setValue', new Date(value))
					.width("100%")
					.on('slide', function(event){
						if (that.currentTime == event.value) return
						that.currentTime = new Date(event.value);
						that.onTimeChange(that.currentTime);
				    });
			},
			updateClock: function(date) {
				$(this.ui.clock.selector).text(date);
			},
    		play: function() {
    			var time = this.currentTime.valueOf();
				time += this.simulationStep * this.timerDelay; // simulationStep==1000 miliseconds  in seconds
				this.currentTime = new Date(time);
				$(this.ui.slider.selector).slider("setValue", this.currentTime);
    			this.onTimeChange(this.currentTime);
				var that = this;
    			this.timer = setTimeout(function() {	
    				that.play();
    			}, this.timerDelay);
    		},
    		pause: function() {
				if (this.timer) {
					clearTimeout(this.timer);
				}
    		},
    		onTimeChange: function(time) {   		
				this.updateClock(time);
				if (this.performanceByTime) {
					this.timeScale = d3.time.scale()
				    	.domain([this.startTime.valueOf(), this.endTime.valueOf()])
				    	.rangeRound([0, this.timeBrushWidth]);
					d3.selectAll('.brush-handle')
						.attr('transform',  "translate(" + this.timeScale(this.currentTime.valueOf()) + "," + 0 + ")");
	    			this.mapViewItem.updateRoutes(this.currentTime);
	    		}
	   //  		this.udpateEventFeed()
    		},
    		timeSeries: function(data) {
    			var margin = {top: 10, right: 10, bottom: 40, left:40},
				    width = 600,
				    height = 200;
				
				var x = d3.time.scale()
				    .domain([this.startTime, this.endTime])
				    .rangeRound([0, width - margin.left - margin.right]);
				var y = d3.scale.linear()
					.domain([0, d3.max(data, function(d) { return d.value; })])
					.range([height - margin.top - margin.bottom, 0]);

				var xAxis = d3.svg.axis()
					.scale(x)
					.orient('bottom')
					.ticks(d3.time.hour, 1)
					.tickFormat(d3.time.format('%H'))
					.tickSize(1)
					.tickPadding(8);

				var yAxis = d3.svg.axis()
					.scale(y)
					.orient('left')
					.tickPadding(8);

				var timeScale = d3.select(".time-series").append("div")
					.attr("class", "time-scale");
				
				var svg = timeScale.append('svg')
					.attr('class', 'chart')
					.attr('width', width)
					.attr('height', height)
					.append('g')
					.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

				svg.selectAll('.chart')
					.data(data)
					.enter().append('rect')
					.attr('class', 'bar')
					.attr('x', function(d) { return x(new Date(d.key)); })
					.attr('y', function(d) { return height - margin.top - margin.bottom - (height - margin.top - margin.bottom - y(d.value)) })
					.attr('width', 10)
					.attr('height', function(d) { return height - margin.top - margin.bottom - y(d.value) });

				svg.append('g')
					.attr('class', 'x axis')
					.attr('transform', 'translate(0, ' + (height - margin.top - margin.bottom) + ')')
					.call(xAxis);
				svg.append('g')
					.attr('class', 'y axis')
					.call(yAxis);
    		},
    		drawContourPlot: function(route, options) { // actually draws the contour plot with the loaded data
    			// console.log("drawing contourplot ", route, options)
    			var width =  options.width;
    			var height =  options.height;
    			var margin = options.margin;
    			var data = route.links
    			// scales
    			var x = d3.scale.linear()
					.range([0, width-margin.left])
					.domain([0,data[0].performance.length]);
				var yReverse = d3.scale.linear()
					.range([height - margin.bottom,0])
					.domain([0,data[data.length-1].properties.offset]);
				var y = d3.scale.linear()
					.range([0,height - margin.bottom])
					.domain([0,data[data.length-1].properties.offset]);		
				var hourTimeFormat = function(d) { 
					// console.log(d , d/3600)
					return d/3600;
					return d.getHours(); 
				};
				var xAxis = d3.svg.axis()
					.scale(x)
					.orient('bottom')
					.tickFormat(hourTimeFormat);
				var yAxis = d3.svg.axis()
					.scale(yReverse)
					.orient('left');
				var contourplot = d3.select(options.class + "." + route.id);
				var chartarea = contourplot.select('.chart-area' + " svg")
					.attr('width', width)
					.attr('height', height)
				var gChartarea = chartarea.append("g")
					.attr('width', width - margin.left)
					.attr('transform',  "translate(" + margin.left + "," + 0 + ")")
				var row = gChartarea.selectAll('.row')
					.data(data)
					.enter()
						.append("svg:g")
						.attr("class", "row")
						.attr('style', 'background-color: red')
						//.attr('width', 10)
						.attr('transform', function(d, i) { // i = index y 
							return "translate(" + 0 + "," + yReverse(d.properties.offset) + ")";
						})
				var cell = row.selectAll(".cell")
					.data(function (d, i) { // i = index y
						return d.performance.map(function(a) { 
								return {
									row: i,
									id: d.properties.id,
									offset: d.properties.offset,
									length: d.properties.length,
									timestamp: a.timestamp,
									speed: a.speed,
									density: a.density, 
									flow: a.flow
								}; 
							});
					})
					.enter()
						.append("svg:rect")
						.attr("class", "cell")
						.attr("x", function(d, i) { // i = index y 
							return x(i); 
						})
						.attr("width", x(1))
						.attr("height", function(d,i) {
							return y(d.length)
						})
						.style("fill", function(d) { 
							return options.speedScale(d.speed);
						})
						.style("stroke", "none")
						.on ("mouseover", function(d) {
							// console.log("todo show tooltip about data", d)
						});;
				var gXAxis = chartarea
					.append("g")
					.attr('transform',  "translate(" + margin.left + "," + (height - margin.bottom) + ")")
					.call(xAxis);
				var gYAxis = chartarea
					.append("g")
					.attr('transform',  "translate(" + margin.left + "," + 0 + ")")
					.call(yAxis);
    			var timebrush =  contourplot.select(this.ui.timebrush.selector + " svg")
    				.attr("width", width)
    				.attr('height', height - margin.bottom)
    			var gTimebrush = timebrush
					.append("g")
					.attr("width", width - margin.left - margin.right)
    				.attr("transform", "translate(" + margin.left + "," + 0 + ")");
				gTimebrush.append('rect')
					.attr('class', 'brush-handle')
					.attr("width", 1)
					.attr("height", 30)
					.attr("x", 0)
					.attr("y", 0)
					.on('')
				gTimebrush.append('rect')
					.attr('class', 'brush-axis')
					.attr("width", options.width - options.margin.left)
					.attr("height", 2);
    		},
    		zoomableTimeSeries: function() {
    			var _data
    				, _svg
    				, _xAxis, _yAxis
    				, _area, _line
    				, _x, _y
    				, _zoom
    				, margin = {top: 0, right: 60, bottom: 30, left: 0}
    				, width = 500 - margin.left - margin.right
    				, height = 100 - margin.top - margin.bottom;
    			function series(selection) {
					var formatDate = d3.time.format("%H");
					_x = d3.time.scale()
						.range([0, width]);
					_y = d3.scale.linear()
						.range([height, 0]);
					_xAxis = d3.svg.axis()
						.scale(_x)
						.orient("bottom")
						.tickSize(-height, 0)
						.tickFormat(formatDate)
						.tickPadding(6);
					_yAxis = d3.svg.axis()
						.scale(_y)
						.orient("right")
						.tickSize(-width)
						.tickPadding(6);
					_area = d3.svg.area()
						.interpolate("step-after")
						.x(function(d) { return _x(d.key); })
						.y0(_y(0))
						.y1(function(d) { return _y(d.value); });
					_line = d3.svg.line()
						.interpolate("step-after")
						.x(function(d) { return _x(d.key); })
						.y(function(d) { return _y(d.value); });
					var svg = selection.append("svg")
						.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom)
						.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					_zoom = d3.behavior.zoom()
						.on("zoom", _draw);
					var gradient = svg.append("defs").append("linearGradient")
						.attr("id", "gradient")
						.attr("x2", "0%")
						.attr("y2", "100%");
					gradient.append("stop")
						.attr("offset", "0%")
						.attr("stop-color", "#fff")
						.attr("stop-opacity", .5);
					gradient.append("stop")
						.attr("offset", "100%")
						.attr("stop-color", "#999")
						.attr("stop-opacity", 1);
					svg.append("clipPath")
						.attr("id", "clip")
						.append("rect")
						.attr("x", _x(0))
						.attr("y", _y(1))
						.attr("width", _x(1) - _x(0))
						.attr("height", _y(0) - _y(1));
					svg.append("g")
						.attr("class", "y axis")
						.attr("transform", "translate(" + width + ",0)");
					svg.append("path")
						.attr("class", "area")
						.attr("clip-path", "url(#clip)")
						.style("fill", "url(#gradient)");
					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")");
					svg.append("path")
						.attr("class", "line")
						.attr("clip-path", "url(#clip)");
					svg.append("rect")
						.attr("class", "pane")
						.attr("width", width)
						.attr("height", height)
						.call(_zoom);
    				_svg = svg;
    			}
    			series.setData = function(data) {
    				// console.log("setData data", data);
    				_data = data;
    				_x.domain([data[0].key, data[data.length-1].key]);
					_y.domain([0, d3.max(data, function(d) { return d.value; })]);
					_zoom.x(_x);
					_svg.select("path.area").data([data]);
					_svg.select("path.line").data([data]);
					_draw();
					return series;
    			}
    			_draw = function() {
					_svg.select("g.x.axis").call(_xAxis);
					_svg.select("g.y.axis").call(_yAxis);
					_svg.select("path.area").attr("d", _area);
					_svg.select("path.line").attr("d", _line);
				}
				return series;
    		},
    		zoomableCountourPlot: function() {
    			var _data
    				, _svg
    				, _xAxis, _yAxis
    				, _area, _line
    				, _x, _y
    				, _zoom
    				, margin = {top: 0, right: 60, bottom: 30, left: 0}
    				, width = 500 - margin.left - margin.right
    				, height = 400 - margin.top - margin.bottom;

    			function series(selection) {

					var formatDate = d3.time.format("%H");

					_x = d3.time.scale()
						.range([0, width]);

					_y = d3.scale.linear()
						.range([height, 0]);

					_xAxis = d3.svg.axis()
						.scale(_x)
						.orient("bottom")
						.tickSize(-height, 0)
						.tickFormat(formatDate)
						.tickPadding(6);

					_yAxis = d3.svg.axis()
						.scale(_y)
						.orient("right")
						.tickSize(-width)
						.tickPadding(6);

					_area = d3.svg.area()
						.interpolate("step-after")
						.x(function(d) { return _x(d.key); })
						.y0(_y(0))
						.y1(function(d) { return _y(d.value); });

					_line = d3.svg.line()
						.interpolate("step-after")
						.x(function(d) { return _x(d.key); })
						.y(function(d) { return _y(d.value); });

					var svg = selection.append("svg")
						.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom)
						.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

					_zoom = d3.behavior.zoom()
						.on("zoom", _draw);

					var gradient = svg.append("defs").append("linearGradient")
						.attr("id", "gradient")
						.attr("x2", "0%")
						.attr("y2", "100%");

					gradient.append("stop")
						.attr("offset", "0%")
						.attr("stop-color", "#fff")
						.attr("stop-opacity", .5);

					gradient.append("stop")
						.attr("offset", "100%")
						.attr("stop-color", "#999")
						.attr("stop-opacity", 1);

					svg.append("clipPath")
						.attr("id", "clip")
						.append("rect")
						.attr("x", _x(0))
						.attr("y", _y(1))
						.attr("width", _x(1) - _x(0))
						.attr("height", _y(0) - _y(1));

					svg.append("g")
						.attr("class", "y axis")
						.attr("transform", "translate(" + width + ",0)");

					svg.append("path")
						.attr("class", "area")
						.attr("clip-path", "url(#clip)")
						.style("fill", "url(#gradient)");

					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")");

					svg.append("path")
						.attr("class", "line")
						.attr("clip-path", "url(#clip)");

					svg.append("rect")
						.attr("class", "pane")
						.attr("width", width)
						.attr("height", height)
						.call(_zoom);

					var timebrush = svg.append("g")
						.attr('class', 'timebrush')
						.attr('width', width)
						.attr('height', height)
	    				.attr('transform', 'translate(0, ' + (height) + ')')
				
					var timeBrushFocus = timebrush.append('g')
						.attr('class', 'brush-handle')
						.attr("width", 20)
						.attr("height", 20)
						.attr("x", 0)
						.attr("y", 0)
						.data([ brushPos ])
						.call(_drag);
					timeBrushFocus.append("rect")
						.attr("width", 1)
						.attr("height", 20)
						.attr("x", 10)
						.attr("y", 0)
					timeBrushFocus.append("rect")
						.attr("width", 20)
						.attr("height", 1)
						.attr("x", 0)
						.attr("y", 10)
					timebrush.append('rect')
						.attr('class', 'brush-axis')
						.attr("width", width - margin.left)
						.attr("height", 2)
						
    				_svg = svg;
    			}
    			var _drag = d3.behavior.drag()
			        .on("drag", function(d,i) {
			            d.x += d3.event.dx
			            d.y += d3.event.dy
			            d3.select(this).attr("transform", function(d,i){
			                return "translate(" + [ d.x,d.y ] + ")"
			            })
			        });
 				var brushPos = { "x":0, "y":0 }

    			series.setData = function(data) {
    				_data = data;
    				_x.domain([data[0].key, data[data.length-1].key]);
					_y.domain([0, d3.max(data, function(d) { return d.value; })]);
					_zoom.x(_x);
					_svg.select("path.area").data([data]);
					_svg.select("path.line").data([data]);
					_draw();
					return series;
    			}
    			_draw = function() {
					_svg.select("g.x.axis").call(_xAxis);
					_svg.select("g.y.axis").call(_yAxis);
					_svg.select("path.area").attr("d", _area);
					_svg.select("path.line").attr("d", _line);
					
				}

				return series;
    		},
			onBeforeClose: function(){ 
				this.pause();
			}
	});
		return MonitorLayout;
	});