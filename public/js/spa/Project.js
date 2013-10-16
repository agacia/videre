define([
	"spa/templates"
	],
	function(templates){
		var Project = Backbone.Marionette.ItemView.extend({
			initialize: function(){
				this.app = this.options.app;
			},
			template: function(){
				return window.JST["project.html"];
			},
			events:{
				"click button.btn.load": "load",
				"change select.projectname": "onChangeProjectname"
			},
			ui: {
				projectname: "select.projectname",
				scenarioname: "select.scenarioname",
				message: "div.message",
				btnload: ".btn.load"
			},
			onShow: function(){
				this.populateProjects(this.app.projects);
				this.ui.projectname.focus();
			},
			populateProjects: function(projects) {
				d3.select(this.ui.projectname.selector).selectAll("option").remove();
				d3.select(this.ui.projectname.selector).selectAll("option")
					.data(projects).enter().append("option")
					.text(function(d) {
						return d.projectname;
					})
					.attr("value", function(d) {
						return d.projectname;
					});
				// select the first element from tle list
				if (projects.length > 0) {
					$(this.ui.projectname.selector).val(projects[0].projectname); //.change();
					this.onChangeProjectname();
				}
			},
			populateScenarios: function(scenarios) {
				d3.select(this.ui.scenarioname.selector).selectAll("option").remove();
				d3.select(this.ui.scenarioname.selector).selectAll("option")
					.data(scenarios).enter().append("option")
					.text(function(d) {
						return d;
					})
					.attr("value", function(d) {
						return d;
					});
				// select the first element from tle list
				if (scenarios.length > 0) {
					$(this.ui.scenarioname.selector).val(scenarios[0]).change();
				}
			},
			onChangeProjectname: function(){
				var selectedProjectName = $( this.ui.projectname.selector+" option:selected" ).val();
				var selectedProject = _.find(this.app.projects, function(obj) { return obj.projectname === selectedProjectName; });
				this.populateScenarios(selectedProject.scenarios);
			},
			load: function(e){
				var that = this;
				$(this.ui.btnload.selector).button('loading');
				e.preventDefault();
				this.app.loadProject(
					this.ui.projectname.val(),
					this.ui.scenarioname.val(),
					function(err){
						that.ui.message.html(err);
					},
					function(){
						that.ui.message.html("Project and scenario loaded! Go to realtime / monitor or prediction view");	
						$(that.ui.btnload.selector).button('reset');
					});
			}
		});
		return Project;
	});