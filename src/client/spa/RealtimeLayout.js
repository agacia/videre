define([
	"spa/templates",
	"spa/Map"
	],
	function(templates, Map){
		var RealtimeLayout = Backbone.Marionette.Layout.extend({
			template: function(){
				return window.JST["realtimelayout.html"];
			},
		  	regions: {
				map: ".map",
				chart: ".chart"
			},
			ui: {
				clock: ".clock",
				playbtn: ".playBtn",
				pausebtn: ".pauseBtn",
			},
			initialize: function(){ 
				this.selectedProject = this.options.app.selectedProject;
				this.timerDelay = 1000;
			},
			onRender: function() {
			},
			onShow: function(){ 
				this.mapViewItem = new Map({project: this.selectedProject});
				this.map.show(this.mapViewItem);
				var that = this;
				$(this.ui.playbtn.selector).on('change', function(e) {
					// console.log("play playbtn checked", $(that.ui.playbtn.selector)[0].checked);
					// console.log("play pause checked",  $(that.ui.pausebtn.selector)[0].checked);
					// play only if not played yet
					if ($(that.ui.playbtn.selector)[0].checked) { // true if change of play button to check
						that.play();
					}
				});
				$('.pauseBtn').on('change', function(e) {
					that.pause();
				});
				this.play();
			},
			onBeforeClose: function(){ 
				this.pause();
			},
			updateClock: function() {
				var date = new Date();
				$(this.ui.clock.selector).text(date.getDate()  + "/" + (date.getMonth()+1) + "/" + date.getFullYear() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
			},
    		play: function() {
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
		return RealtimeLayout;
	});