define([
	"spa/templates"
	],
	function(templates){
		var Prediction = Backbone.Marionette.ItemView.extend({
			template: function(){
				return window.JST["prediction.html"];
			},
			ui: {
				message: "div.message",
				predictbtn: ".predict.btn",
				
			},
			events: {
				"click .predict.btn": "launchPrediction"
				// "change .select.availabledate": "onChangeAvailableDate"
			},
			onShow: function() { 
				this.initializeEventsSelection();
				this.initializeStrategiesSelection();
			},
			initialize: function(){
				this.app = this.options.app; 
			},
			initializeEventsSelection: function() {
				// populates checkboxes with route names
				var eventsList = this.app.currentEvents;
				
				var eventsSelect = d3.select(".events_selection span");
				// console.log("eventsSelect", eventsSelect, "this.app.selectedProject.scenario.routes;", this.app.selectedProject.scenario.routes);
				eventsSelect.selectAll("label").remove();
				eventsSelect.selectAll("input").remove();
				eventsSelect.selectAll("input")
					.data(eventsList).enter()
					.append('label')
					.attr('for',function(d,i){ return d.id; })
					.text(function(d) { return d.description; })
					.append("input")
					.attr("checked", true)
					.attr("type", "checkbox")
					.attr("id", function(d,i) { return d.id; })
					.on("click", function() {
						var ele = $(this);
						var routeId = ele.attr("id");
						if (ele.is(':checked')){
							ele.attr('checked', true);
						}
						else {
							ele.attr('checked', false);
						}
					});	
			},
			initializeStrategiesSelection: function() {
				// populates checkboxes with route names
				var strategiesList = 
				[{ name:"Ramp metering strategy for on-ramp no 70", id:"strategy1"},
				{ name:"Reroute traffic to off-ramp no 71", id:"strategy2"},
				{ name:"Do nothing", id:"strategy2"}];
				var strategiesSelect = d3.select(".strategies_selection span");
				// console.log("strategiesSelect", strategiesSelect, "this.app.selectedProject.scenario.routes;", this.app.selectedProject.scenario.routes);
				strategiesSelect.selectAll(".strategy-el").remove();
				var strategies = strategiesSelect.selectAll(".strategy-el")
					.data(strategiesList).enter()
					.append('div')
					.attr('class','strateg-el')
				strategies.append("input")
					.attr("checked", true)
					.attr("type", "checkbox")
					.attr("id", function(d,i) { return d.id; })
					.on("click", function() {
						var ele = $(this);
						var routeId = ele.attr("id");
						if (ele.is(':checked')){
							ele.attr('checked', true);
							d3.select("g#"+routeId).style("display","block");
							console.log("show ", d3.select(".contourplot."+routeId), routeId)
							d3.select(".contourplot."+routeId).style("display","block");
						}
						else {
							ele.attr('checked', false);
							d3.select("g#"+routeId).style("display","none");
							d3.select(".contourplot."+routeId).style("display","none");
						}
					});	
				strategies.append('label')
					.attr('for',function(d,i){ return d.id; })
					.text(function(d) { return d.name; })
				
			},
			launchPrediction: function() {
				alert("This is a demo version. Please log in for full functionality.")
			}
		});
		return Prediction;
	}
	
	);