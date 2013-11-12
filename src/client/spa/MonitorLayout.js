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
				contourplot: "#contourplot"
			},
			events: {
				"submit": "load"
				// "change .select.availabledate": "onChangeAvailableDate"
			},
			initialize: function(){
				this.app = this.options.app; 
				console.log("this.selectedProject ", this.app.selectedProject);
				this.timerDelay = 1000;
				var now = new Date();
				this.simulationDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
				this.simulationStep = 1000;
				this.loadedDates = {};
				this.loadedData = {};
				this.currentTime = 0;
				
			},
			onShow: function() { 
				this.contourPlotOptions = {
					"canvasId" : this.ui.contourplot.selector,
					"width": 500,
					"height": 300,
					"margin": {
						"top": 0,
						"left": 0,
						"bottom": 20,
						"right": 0
					}
				}
				// show map with routes (without performance )
				this.mapViewItem = new Map({project: this.app.selectedProject});
				this.map.show(this.mapViewItem);
				// initialise controls
				this.initialiseDateSelection();

				// show empty visualisation board
				this.initialiseSlider(0,0,1,1);
				this.initialiseContourPlot(this.contourPlotOptions);
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
				var dateName = this.getDateName(date);
				if (dateName in this.loadedDates) {
					this.ui.message.html("Data for the selected date " + date + " loaded.");
					this.loadedData = this.loadedDates[dateName];
					$(this.ui.playbtn.selector).parent().removeClass('disabled');
					$(this.ui.pausebtn.selector).parent().removeClass('disabled');
					this.drawContourPlot(this.loadedData, this.contourPlotOptions);
					this.onDataPerformanceUpdate();
				}
				else {
					this.ui.message.html("Click the button Load to load data for the selected date " + date );
				}
			},
			getDateName: function(date) {
				var day = date.getDate() + 1
				day = day < 10 ? '0'+day : day;
				var month = +date.getMonth() + 1;
				month = date.getMonth() < 10 ? '0'+month : month;
				var dateFolder = date.getFullYear()+month+day;
				return dateFolder;
			},
			load: function(e){
				e.preventDefault();
				var that = this;
				$(this.ui.btnload.selector).button('loading');
				console.log("requesting data for ", this.simulationDate, " date: ", this.getDateName(this.simulationDate))
				this.app.loadData(
					this.app.selectedProject.projectname,
					this.app.selectedProject.scenario.name,
					this.getDateName(this.simulationDate),
					function(err) {
						that.ui.message.html(err);
					},
					function(data) {
						if (data.length > 0) {
							that.ui.message.html("Data loaded! Interact with the map and charts.");	
							$(that.ui.btnload.selector).button('reset');
							$(that.ui.playbtn.selector).parent().removeClass('disabled');
							$(that.ui.pausebtn.selector).parent().removeClass('disabled');
							console.log("/readScenarioData response", data);
							var dateName = that.getDateName(that.simulationDate);
							for (var i in data) {
								var timestamp = data[i].fileName.split('.')[0];
								timestamp = timestamp.split('_')[1];
								data[i].timestamp = +timestamp;
							}
							// sort 
							data = _.sortBy(data, function(obj){ return obj.timestamp });
							that.loadedDates[dateName] = data;
							// todo cluster data to routes 

							that.assignPerformanceData(data);

							that.loadedData = data;
							var startTime = data[0].timestamp;
							var endTime = data[data.length-1].timestamp;
							var secondTime = data.length > 1 ? data[1].timestamp : startTime;
							that.simulationStep = secondTime - startTime;
							that.currentTime = startTime;
							that.initialiseSlider(that.currentTime, startTime, endTime, that.simulationStep);
							that.drawContourPlot(that.loadedData, that.contourPlotOptions);
							that.onDataPerformanceUpdate();
						}
						else {
							that.ui.message.html("Empty data!");
							$(that.ui.btnload.selector).button('reset');
						}
					});
			},
			assignPerformanceData: function(data) {
				for (var routeId in this.app.selectedProject.scenario.routes) {
					var route = this.app.selectedProject.scenario.routes[routeId];
					for (var linkId in route.links) {
						var link = route.links[linkId];
						var linkPerformance = this.getPerformanceForLink(link.properties.id, data);
						link.performance = linkPerformance;
					}
				}
				console.log("routes with performance data ", this.app.selectedProject.scenario.routes)
			},
			getPerformanceForLink: function(linkId, performanceData) {
				return {
				"time0" : {"speed": 20, "density" : 1, "flow" : 2},
				"time1" : {"speed": 20, "density" : 1, "flow" : 2} 
				}
				
			},
			initialiseSlider: function(value, min, max, step) {
				if (this.slider) {
					$(".slider").remove();   
				   $("#slider-wrapper").append("<div id='slider'></div>");
				}
				var options = {"min": min, "max" : max, "step":step}
				var that = this;
			    this.slider = $(this.ui.slider.selector)
			    	.slider(options)
				    .slider('setValue', value)
					.width("100%")
					.on('slide', function(event){
						that.currentTime = event.value;
						// overwrite the simulationDate with with the value from the slider
						var oldSimualtionDate = that.simulationDate;
						var hour = Math.floor(that.currentTime / 3600);
						var minute = Math.floor((that.currentTime % 3600) / 60);
						var seconds = (that.currentTime % 3600) % 60;
						// console.log("hour", hour, "min", minute, "sec", seconds);
						that.simulationDate = new Date(oldSimualtionDate.getFullYear(), oldSimualtionDate.getMonth(), oldSimualtionDate.getDate(),
							hour, minute, seconds, 0);
						// console.log(that.currentTime, " -> " , that.simulationDate )
						that.updateClock()
						that.onDataPerformanceUpdate();
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
    			if (this.loadedData && this.loadedData.length > 0) {
	    			this.run();
					this.updateClock();
					this.onDataPerformanceUpdate();
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
    		onDataPerformanceUpdate: function() {
    			this.updateMap();
    		},
    		updateMap: function() {
    			var width = this.svgTimebrush.attr("width");
    			var data = this.loadedData;
    			if (data.length > 0) {
	    			var timeScale = d3.scale.linear()
							.range([0, width])
							.domain([+data[0].timestamp,+data[data.length-1].timestamp]);
					d3.select('.timebrush .brush-handle')
						.attr('transform',  "translate(" + timeScale(this.currentTime) + "," + 0 + ")");
					var currentTimeData = {};
					for (var i = 0; i < data.length; i++) { 
						if(data[i].timestamp === this.currentTime ) { 
							currentTimeData = data[i]; 
						} 
					}
	    			this.mapViewItem.updatePaths(this.currentTime);
	    		}
    		},
    		drawContourPlot: function(data, options) { // actually draws the contour plot with the loaded data
    			if (data.length > 0) {
	    			var width =  options.width;
	    			var height =  options.height;

	    			// scales
	    			var x = d3.scale.linear()
						.range([0, width])
						.domain([0,data.length]);
					var y = d3.scale.linear()
						.range([0, height])
						.domain([0,data[0].data.length]);
					var colorScale = d3.scale.linear()
						.domain([0, 32])
						.range(['red', 'green']);

					var xAxis = d3.svg.axis()
						.scale(x)
						.orient('bottom');

					// console.log("translate axis", height - options.margin.bottom)
					var gXAxis = this.svgContourplot.append("g")
						// .attr('transform',  "translate(" + 0 + "," + height - options.margin.bottom + ")")
						.call(xAxis);

					var column = this.svgContourplot.selectAll("column")
						.data(data)
						.enter()
						.append("svg:g")
						.attr("class", "column")
					var cell = column.selectAll(".cell")
						.data(function (d, i) { // i = index x
							// console.log("setting data for cell: d", d, " i ", i);
							// return d.data;
							return d.data.map(function(a) { 
								// console.log("mapping ", a)
								return {
									column: i,
									timestamp: d.timestamp,
									linkId: a[0],
									speed: a[1],
									density: a[2], // todo check which one is density (no names in tsv file!)
									flow: a[3]
								}; 
							});
						})
						.enter()
							.append("svg:rect")
							.attr("class", "cell")
							.attr("x", function(d, i) { // i = index y 
								// console.log("cell.x d", d, " i ", i)
								return x(d.column); 
							})
							.attr("y", function(d, i) { 
								return y(i); 
							})
							.attr("width", x(1))
							.attr("height", y(1))
							.style("fill", function(d) { 
								return colorScale(d.speed); 
							})
						.on ("mouseover", function(d) {
							console.log("todo show tooltip about data", d)
							// d3.select("g#"+collection.route_id).selectAll("path").classed("hover", true)
							// console.log("hover " + collection.route_id)
						});;
				}

    		},
    		initialiseContourPlot: function(options) { // draws an empty contourplot
    			
    			var margin = options.margin;
    			
    			// timeline 
    			this.svgTimebrush = d3.select(".timebrush").append("svg:svg")
					.attr("width", options.width)
					.attr("height", 50);
				var groupTimebrush = this.svgTimebrush.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
				this.svgTimebrush.append('rect')
					.attr('class', 'brush-handle')
					.attr("width", 1)
					.attr("height", options.height)
					.attr("x", 0)
					.attr("y", 0);	
				this.svgTimebrush.append('rect')
					.attr('class', 'brush-axis')
					.attr("width", options.width)
					.attr("height", 2);

    			// contourplot
				this.svgContourplot = d3.select(options.canvasId).append("svg:svg")
					.attr("width", options.width)
					.attr("height", options.height)
				// var group = this.svgContourplot.append("g")
				// 	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
				var data = [	// time				// array of links performance [linkid, speed, density, flow]
					{"timestamp" : 0, "data" : [[0, 10, 1, 1],[1, 20, 1, 1],[2, 30, 1, 1]]},
					{"timestamp" : 10, "data" : [[0, 40, 1, 1],[1, 50, 1, 1],[2, 50, 1, 1]]},
					{"timestamp" : 20, "data" : [[0, 70, 1, 1],[1, 80, 1, 10],[2, 90, 1, 1]]}
				];
				this.drawContourPlot(data, options);
		

				// var row = this.svgContourplot.selectAll(".row")
				// 	.data(data)
				// 	.enter().append("svg:g")
				// 	.attr("class", "row");

				// var col = row.selectAll(".cell")
				// 	.data(function (d,i) { return d.map(function(a) { return {value: a, row: i}; } ) })
				// 	.enter().append("svg:rect")
				// 		.attr("class", "cell")
				// 		.attr("x", function(d, i) { return x(i); })
				// 		.attr("y", function(d, i) { return y(d.row); })
				// 		.attr("width", x(1))
				// 		.attr("height", y(1))
				// 		.style("fill", function(d) { return colorScale(d.value); });

			},
			onBeforeClose: function(){ 
				this.pause();
			}

	});
		return MonitorLayout;
	});