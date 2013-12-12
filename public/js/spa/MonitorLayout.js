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
				// console.log("initialize this.selectedProject ", this.app.selectedProject);
				this.timerDelay = 600;
				var now = new Date();
				this.simulationDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
				this.simulationStep = 1000;
				this.loadedDates = {};
				this.currentTime = 0;
				this.dateName = 0;
				
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
					"speedScale": d3.scale.linear().domain([0, 32]).range(['red', 'green']),
					"flowScale": d3.scale.linear().domain([0, 0.1]).range([1, 20]),
					"densityScale": d3.scale.linear().domain([0, 1]).range([0, 1])
				}
				// show map with routes (without performance )
				this.mapViewItem = new Map({project: this.app.selectedProject});
				this.map.show(this.mapViewItem);
				this.mapViewItem.setOptions(this.contourPlotOptions)
				this.initialiseDateSelection();
				this.initializeOverlaySelection();
				this.initializeRouteSelection();
				this.initializeRouteSelectionForCharts();
				this.initialiseSlider(0,0,1,1);

			},
			showAddEvent: function() {
				$(".newEvent.window").show();
			},
			hideAddEvent: function() {
				$(".newEvent.window").hide();
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
				// this.initializeCalender();
				// populateAvailableDates select
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
				}
			},
			onChangeAvailableDate: function(date) {
				this.pause();
				var date = new Date($(this.ui.availabledate.selector+" option:selected" ).val());
				// this.datepicker.data('datepicker').setValue(date);
				this.onChangeDate(date);
			},
			onChangeDate: function(date) {   
				// var date = date.valueOf();   
				// date = date + 7 * 3600 * 1000;
				this.simulationDate = date;
				this.currentTime = 0;
				this.dateName = this.getDateName(date);
				if (this.dateName in this.loadedDates) {
					this.ui.message.html("Data for the selected date " + date + " loaded.");
					$(this.ui.playbtn.selector).parent().removeClass('disabled');
					$(this.ui.pausebtn.selector).parent().removeClass('disabled');
					this.onTimeChange();
				}
				else {
					this.ui.message.html("Click the button Load to load data for the selected date " + date );
				}
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
							// d3.select("g#"+routeId).style("display","block");
							d3.select(".contourplot."+routeId).style("display","block");
						}
						else {
							ele.attr('checked', false);
							// d3.select("g#"+routeId).style("display","none");
							d3.select(".contourplot."+routeId).style("display","none");
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
								// console.log("show overlay", overlay)
								// d3.select(".contourplot."+routeId).style("display","block");
							}
							else {
								ele.attr('checked', false);
								d3.select("."+overlay).style("display","none");
								// d3.select(".contourplot."+routeId).style("display","none");
							}
						});
				
			},
			goPredict: function(e) {
				e.preventDefault
				this.app.showPrediction();
			},
			load: function(e){
				e.preventDefault();
				var that = this;
				$(this.ui.btnload.selector).button('loading');
				// console.log("requesting data for ", this.simulationDate, " date: ", this.getDateName(this.simulationDate))
				if (!this.dateName) {
					this.dateName = this.getDateName(this.simulationDate)
				}
				this.app.loadData(
					this.app.selectedProject.projectname,
					this.app.selectedProject.scenario.name,
					this.dateName,
					function(err) {
						that.ui.message.html(err);
					},
					function(data) {
						if (data) {
							that.ui.message.html("Data loaded! Interact with the map and charts.");	
							$(that.ui.btnload.selector).button('reset');
							$(that.ui.playbtn.selector).parent().removeClass('disabled');
							$(that.ui.pausebtn.selector).parent().removeClass('disabled');
							// if (data.events) {
							// 	that.gotEventsData(data.events.jsonArray);
							// }
							// if (data.performance) {
							// 	that.gotPerformanceData(data.performance.jsonArray);
							// }
							if (data.performance.crossfilterArray) {
								var performance = crossfilter(data.performance.crossfilterArray);
								// console.log("performance", performance);
								var performanceByDate = performance.dimension(function(d) { return d.timestamp; });
								// console.log("performanceByDate", performanceByDate)
								// var nonZeroPer = performanceByDate.filter(function(d) { return d > 0; });
								// console.log("nonZeroPerformance", nonZeroPer)
								var selectedPerformance = performanceByDate.top(Infinity);
								console.log("selectedPerformance", selectedPerformance.length);
								var group = performanceByDate.group();
								console.log("group", group.top(Infinity))
							}
							// console.log("loaded this.loadedDates[dateName]", that.dateName, that.loadedDates[that.dateName]);
							
						}
						else {
							that.ui.message.html("Empty data!");
							$(that.ui.btnload.selector).button('reset');
						}
					});
			},
			sortByTimestamp: function(data) {
				
				// time += this.simulationStep * 1000; // simulationStep in seconds
				var dateValue = this.simulationDate.valueOf();
				var milisec = 1000;
				
				for (var i in data) {
					var timestamp = data[i].fileName.split('.')[0];
					timestamp = timestamp.split('_')[1];
					data[i].timestamp = +timestamp;
					data[i].date = new Date(dateValue + timestamp * milisec); 
				}
				// sort 
				data = _.sortBy(data, function(obj){ return obj.timestamp });
				return data;
			},
			gotPerformanceData: function(data) {
				if (!(this.dateName in this.loadedDates)) {
					this.loadedDates[this.dateName] = {}
				}
				this.loadedDates[this.dateName].performance = this.sortByTimestamp(data)
				var startTime = this.loadedDates[this.dateName].performance[0].timestamp;
				var endTime = startTime;
				var secondTime = startTime;				
				if (this.loadedDates[this.dateName].performance.length > 0) {
					endTime = this.loadedDates[this.dateName].performance[this.loadedDates[this.dateName].performance.length-1].timestamp
					if (endTime == 86400 && this.loadedDates[this.dateName].performance.length > 1) {
						endTime = this.loadedDates[this.dateName].performance[this.loadedDates[this.dateName].performance.length-2].timestamp;
					}
					secondTime = this.loadedDates[this.dateName].performance.length > 1 ? this.loadedDates[this.dateName].performance[1].timestamp : startTime;
				}
				this.simulationStep = secondTime - startTime;
				this.currentTime = startTime;
				this.initialiseSlider(this.currentTime, startTime, endTime, this.simulationStep); // todo lastSimulation step 
				
			
				// create chart-containers
				var routes = this.app.selectedProject.scenario.routes;

				var contourplotClass = this.contourPlotOptions.class;
				var chart = d3.select(".chart").selectAll(contourplotClass)
	    			.data(routes)
	    			.enter()
					.append('div')
    				.attr('class', function(d) { return 'contourplot ' +d.id; })
    				.attr('width', this.contourPlotOptions.width)
    				.attr('height', this.contourPlotOptions.height)
    			chart.append('div')
    				.attr('class', 'chart-area')
    				.append("svg:svg")
				chart.append('div')
					.attr('class', 'timebrush')
					.append("svg:svg")
    				
				// assign performance data for each route
				this.readPerformanceForRoutes(routes, this.loadedDates[this.dateName].performance)
				for (var routeId in routes) {
					this.drawContourPlot(routes[routeId], this.contourPlotOptions);
				}
				this.onTimeChange();

				
				
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

			readPerformanceForRoutes: function(routes, performanceData) {
				var linkPerformance = this.getPerformanceForLinks(performanceData)
				for (var routeId in routes) {
					var route = routes[routeId];
					for (var linkId in route.links) {
						var link = route.links[linkId];
						link.performance = linkPerformance[link.properties.id];
					}
				}
			},
			getPerformanceForLinks: function(performanceData) {
				var linkPerformance = {}
				for (var i in performanceData) {
					var timeData = performanceData[i]
					var timestamp = timeData['timestamp']
					for (var j in timeData['data']) {
						var linkData = timeData['data'][j]
						var linkId = linkData[0]
						if (!(linkId in linkPerformance)) {
							linkPerformance[linkId] = []
						}
						linkPerformance[linkId].push({
							"timestamp": timestamp, 
							"date": timeData['date'],
							"speed": linkData[1], 
							"density" : linkData[2], 
							"flow" : linkData[3] // todo which column is density and flow?
						})
					}
				}
				// performance.push({"timestamp": 0, "speed": 20, "density" : 1, "flow" : 2})
				// performance.push({"timestamp": 1, "speed": 10, "density" : 1, "flow" : 2})
				// performance.push({"timestamp": 2, "speed": 30, "density" : 1, "flow" : 2})
				return linkPerformance
			},
			initialiseSlider: function(value, min, max, step) {
				if (this.slider) {  
					d3.select(".slider").remove(); 
				   	$("#slider-wrapper").append("<div id='slider'></div>");
				}
				var options = {"min": min, "max" : max, "step":step}
				var that = this;
			    this.slider = $(this.ui.slider.selector)
			    	.slider(options)
				    .slider('setValue', value)
					.width("100%")
					.on('slide', function(event){
						if (that.currentTime == event.value) return
						that.currentTime = event.value;
						// overwrite the simulationDate with with the value from the slider
						var oldSimualtionDate = that.simulationDate;
						var hour = Math.floor(that.currentTime / 3600);
						var minute = Math.floor((that.currentTime % 3600) / 60);
						var seconds = (that.currentTime % 3600) % 60;
						that.simulationDate = new Date(oldSimualtionDate.getFullYear(), oldSimualtionDate.getMonth(), oldSimualtionDate.getDate(),
							hour, minute, seconds, 0);
						that.updateClock()
						that.onTimeChange();
				    });
			},
			// initializeCalender: function() {
			// 	// var today = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);
			// 	var that = this;
			// 	// var datepicker = $(this.ui.calender.selector).datepicker().data('datepicker').setValue(this.simulationDate);
			// 	this.datepicker = $(this.ui.calender.selector).datepicker({
			// 		autoclose: true,
			// 		todayHighlight: true,
			// 		endDate: that.simulationDate
			// 	});
			// 	this.datepicker.on('changeDate', function(e, data){
			// 		that.onChangeDate(e.date);
			// 	}).data('datepicker').setValue(this.simulationDate);
			// },
			run: function() {
				this.currentTime += this.simulationStep;
				var time = this.simulationDate.valueOf();
				time += this.simulationStep * 1000; // simulationStep in seconds
				this.simulationDate = new Date(time);
			},
			updateClock: function(date) {
				var day = this.simulationDate.getDate() < 10 ? "0"+this.simulationDate.getDate() : this.simulationDate.getDate();
				var month = this.simulationDate.getMonth()+1;
				month = month < 10 ? "0"+month : month;
				var year = this.simulationDate.getFullYear() < 10 ? "0"+this.simulationDate.getFullYear() : this.simulationDate.getFullYear();
				var hour = this.simulationDate.getHours() < 10 ? "0"+this.simulationDate.getHours() : this.simulationDate.getHours();
				var minute = this.simulationDate.getMinutes() < 10 ? "0"+this.simulationDate.getMinutes() : this.simulationDate.getMinutes();
				var second = this.simulationDate.getSeconds() < 10 ? "0"+this.simulationDate.getSeconds() : this.simulationDate.getSeconds();
				$(this.ui.clock.selector).text( hour + ":" + minute + ":" + second + " " +day + "-" + month + "-" + year);
			},
    		play: function() {
    			if (this.loadedDates[this.dateName] && this.loadedDates[this.dateName].performance.length > 0) {
	    			this.run();
					this.updateClock();
					this.onTimeChange();
					var that = this;
	    			this.timer = setTimeout(function() {	
	    				that.play();
	    			}, this.timerDelay);
    			}
    		},
    		pause: function() {
				if (this.timer) {
					clearTimeout(this.timer);
				}
    		},
    		onTimeChange: function() {
    			$(this.ui.slider.selector).slider("setValue", this.currentTime)


    			var width = this.contourPlotOptions.width;
    			this.dateName = this.getDateName(this.simulationDate);
				var performanceData = this.loadedDates[this.dateName].performance
    			if (performanceData.length > 0) {
	    			// update timebrush on plots
	    			var timeScale = d3.scale.linear()
							.range([0, width])
							.domain([+performanceData[0].timestamp,+performanceData[performanceData.length-1].timestamp]);
					d3.select('.timebrush .brush-handle')
						.attr('transform',  "translate(" + timeScale(this.currentTime) + "," + 0 + ")");
	    			this.mapViewItem.updatePaths(this.currentTime);
	    		}
	    		this.udpateEventFeed()
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
					.attr("y", 0);	
				gTimebrush.append('rect')
					.attr('class', 'brush-axis')
					.attr("width", options.width - options.margin.left)
					.attr("height", 2);

    		},
			onBeforeClose: function(){ 
				this.pause();
			}

	});
		return MonitorLayout;
	});