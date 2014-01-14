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
			// this.layout.content.show(new Project());
			// this.loadProjects(null, function(){});
			this.showProjectForm();
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
					// console.log("/listProjects data", data);
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
					app.layout.content.show(new Project({app: app}));
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
					app.selectedProjectname = null
				},
				success: function(data){
					app.selectedProjectname = projectname;
					var selectedProject = _.find(app.projects, function(obj) { return obj.projectname === projectname; });
					selectedProject.scenario = data
					// console.log("/readScenario", selectedProject)
					cbSuccess();
				}
			});
		},
		loadData: function(projectname, scenarioname, date, cbError, cbSuccess){
			var app = this;
			$.ajax({
				url: "/readScenarioData/"+projectname+"/"+scenarioname+"/"+date,
				type: "GET",
				error: function (data){
					data = JSON.parse(data.responseText);
					cbError(data.error);
				},
				success: function(data){
					console.log("/readScenarioData response", data)
					cbSuccess(data);
				}
			});
		},
		showMonitor: function(options){
			this.selectedProject = null;
			for (var project in this.projects) {
				if (this.projects[project].projectname === this.selectedProjectname) {
					this.selectedProject = this.projects[project];
					break;
				}
			}
			if (this.selectedProject) {
				var layout;
				if (options.mode === "real-time") {
					layout = new RealtimeLayout({app: this});
				}
				else if (options.mode === "historical") {
					layout = new MonitorLayout({app: this});
				}
				this.layout.content.show(layout);
			}
			else {
				this.showBlank("Monitot view not available!");
			}
		},
		showBlank: function(title) {
			this.layout.content.show(new Blank({
				title : title,
				message : "No projects",
				details : "Please load project first."
			}));
		},
		showPrediction: function(){
			for (var project in this.projects) {
				var selectedProject;
				if (this.projects[project].projectname === this.selectedProjectname) {
					selectedProject = this.projects[project];
					break;
				}
			}
			if (selectedProject) {
				this.layout.content.show(new Prediction({app: this}));
			}
			else {
				this.showBlank("View prediction not available!");
			}
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