define([
	"spa/Layout",
	"spa/Menu",
	"spa/Board",
	"spa/Project",
	"spa/MonitorLayout",
	"spa/RealtimeLayout",
	"spa/Map",
	"spa/Prediction",
	"spa/Login",
	"spa/Blank"
	], 
	function(Layout, Menu, Board, Project, MonitorLayout, RealtimeLayout, Map, Prediction, Login, Blank){
	var App = Backbone.Marionette.Application.extend({
		init: function(){
			this.layout = new Layout();
			this.mainRegion.show(this.layout);
			this.layout.menu.show(new Menu({
				app: this
			}));
			this.layout.content.show(new Board());
			this.loadProjects(null, function(){});
		},
		loadProjects: function(cbError, cbSuccess) {
			var app = this;
			$.ajax({
				url: "/listProjects",
				type: "GET",
				statusCode: {
					401: function (data){
						data = JSON.parse(data.responseText);
						cbError(data.error);
					}
				},
				success: function(data){
					app.projects = data;
					cbSuccess();
				}
			});
		},
		showBoard: function(){
			this.layout.content.show(new Board());
		},
		showProjectForm: function(){
			if (this.projects) {
				this.layout.content.show(new Project({app: this}));
			}
			else {
				var app = this;
				this.loadProjects(null, function() {
					// app.layout.content.show(app.projectView);
					this.layout.content.show(new Project({app: app}));
				});
			}
		},
		loadProject: function(projectname, scenarioname, cbError, cbSuccess){
			var app = this;
			$.ajax({
				url: "/readScenario/"+projectname+"/"+scenarioname,
				type: "GET",
				error: function (data){
					data = JSON.parse(data.responseText);
					cbError(data.error);
				},
				success: function(data){
					var project = 
					app.scenario = data;
					app.selectedProjectname = projectname;
					var selectedProject = _.find(app.projects, function(obj) { return obj.projectname === projectname; });
					selectedProject.scenario = data
					cbSuccess();
				}
			});
		},
		showMonitor: function(options){
			for (var project in this.projects) {
				var selectedProject;
				if (this.projects[project].projectname === this.selectedProjectname) {
					selectedProject = this.projects[project];
					break;
				}
			}
			if (selectedProject) {
				var layout;
				if (options.mode === "realtime") {
					layout = new RealtimeLayout({app: this});
					}
				else if (options.mode === "historical") {
					layout = new MonitorLayout({app: this});
				}
				this.layout.content.show(layout);
				layout.map.show(new Map({project: selectedProject}));
			}
			else {
				this.layout.content.show(new Blank({
					message : {
						title : "No project",
						details : "Please load project first."
					}
				}));
			}
		},
		showPrediction: function(){
			this.layout.content.show(new Prediction());
		},
		showLoginForm: function(){
			this.layout.content.show(new Login({
				app: this
			}));
		},
		login: function(username, password, cbError, cbSuccess){
			var app = this,
				rnd = Math.random() * 1000,
				publicKey = username,
				privateKey = password,
				content = "publicKey=" + publicKey + "&rnd=" + rnd,
				shaObj =  new JsSHA(content, "ASCII");
			$.ajax({
				url: "/api/auth",
				type: "POST",
				dataType: "json",
				data: {
					publicKey: publicKey,
					rnd: rnd,
					signature: shaObj.getHMAC(privateKey, "ASCII", "HEX")

				},
				statusCode: {
					401: function (data){
						data = JSON.parse(data.responseText);
						cbError(data.error);
					}
				},
				success: function(data){
					if(data.error){
						cbError(data.error);
					}else{
						app.loggedIn = true;
						cbSuccess();
					}
				}
			});
		}
	});
	return App;
});