define([
	"spa/templates"
	],
	function(templates){
		var Project = Backbone.Marionette.ItemView.extend({
			initialize: function(){
				console.log("Project.initialize this", this.options)
				this.app = this.options.app;
			},
			template: function(){
				return window.JST["project.html"];
			},
			events:{
				"click button.btn.load": "load"
			},
			ui: {
				projectname: "select.projectname",
				scenarioname: "select.scenarioname",
				message: "div.message"
			},
			onShow: function(){
				this.ui.projectname.focus();
			},
			load: function(e){
				var that = this;
				e.preventDefault();
				this.app.load(
					this.ui.projectname.val(),
					this.ui.scenarioname.val(),
					function(err){
						that.ui.message.html(err);
					},
					function(){
						that.ui.message.html("Project and scenario loaded!");	
					});
			}
		});
		return Project;
	});