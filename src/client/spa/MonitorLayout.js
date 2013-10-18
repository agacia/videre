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
				// calender: ".calender",
				clock: ".clock",
				playbtn: ".playBtn",
				pausebtn: ".pauseBtn",
				availabledate: ".select.availabledate"
			},
			events: {
				// "change .select.availabledate": "onChangeAvailableDate"
			},
			initialize: function(){
				this.selectedProject = this.options.app.selectedProject; 
				this.timerDelay = 1000;
				var now = new Date();
				this.simulationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
				this.simulationSpeed = 1000;
			},
			onShow: function(){ 
				this.mapViewItem = new Map({project: this.selectedProject});
				this.map.show(this.mapViewItem);
				var that = this;
				$(this.ui.playbtn.selector).on('change', function(e) {
					if ($(that.ui.playbtn.selector)[0].checked) { // true if change of play button to check
						that.play();
					}
				});
				$('.pauseBtn').on('change', function(e) {
					that.pause();
				});
				// this.initializeCalender();
				this.populateAvailableDates(this.selectedProject.scenario.realtime);
			},
			onBeforeClose: function(){ 
				this.pause();
			},
			populateAvailableDates: function(dates) {
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
				var date = new Date($(this.ui.availabledate.selector+" option:selected" ).val());
				// this.datepicker.data('datepicker').setValue(date);
				this.onChangeDate(date);
			},
			onChangeDate: function(date) {   
				// var date = date.valueOf();   
				// date = date + 7 * 3600 * 1000;
				this.simulationTime = date;
				this.updateClock();
			},
			// initializeCalender: function() {
			// 	// var today = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);
			// 	var that = this;
			// 	// var datepicker = $(this.ui.calender.selector).datepicker().data('datepicker').setValue(this.simulationTime);
			// 	this.datepicker = $(this.ui.calender.selector).datepicker({
			// 		autoclose: true,
			// 		todayHighlight: true,
			// 		endDate: that.simulationTime
			// 	});
			// 	this.datepicker.on('changeDate', function(e, data){
			// 		that.onChangeDate(e.date);
			// 	}).data('datepicker').setValue(this.simulationTime);
			// },
			run: function() {
				var time = this.simulationTime.valueOf() + this.simulationSpeed;
				this.simulationTime = new Date(time);
			},
			updateClock: function() {
				var day = this.simulationTime.getDate() < 10 ? "0"+this.simulationTime.getDate() : this.simulationTime.getDate();
				var month = this.simulationTime.getMonth()+1;
				month = month < 10 ? "0"+month : month;
				var year = this.simulationTime.getFullYear() < 10 ? "0"+this.simulationTime.getFullYear() : this.simulationTime.getFullYear();
				var hour = this.simulationTime.getHours() < 10 ? "0"+this.simulationTime.getHours() : this.simulationTime.getHours();
				var minute = this.simulationTime.getMinutes() < 10 ? "0"+this.simulationTime.getMinutes() : this.simulationTime.getMinutes();
				var second = this.simulationTime.getSeconds() < 10 ? "0"+this.simulationTime.getSeconds() : this.simulationTime.getSeconds();
				$(this.ui.clock.selector).text( hour + ":" + minute + ":" + second + " " +day + "-" + month + "-" + year);
			},
    		play: function() {
    			this.run();
				this.updateClock();
				if (this.mapViewItem) {
					this.mapViewItem.updatePaths();
				}
				var that = this;
    			this.timer = setTimeout(function() {	
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
		return MonitorLayout;
	});