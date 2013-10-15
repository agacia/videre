define([
	"spa/Layout",
	"spa/Menu",
	"spa/Board",
	"spa/Project",
	"spa/Monitor",
	"spa/Prediction",
	"spa/Login"
	], 
	function(Layout, Menu, Board, Project, Monitor, Prediction, Login){
	var App = Backbone.Marionette.Application.extend({
		init: function(){
			this.layout = new Layout();
			this.mainRegion.show(this.layout);
			this.layout.menu.show(new Menu({
				app: this
			}));
			this.layout.content.show(new Board());
			this.loadProjects(null, null);
			this.monitors = [];

		},
		loadProjects: function(cbError, cbSuccess) {
			var app = this;
			$.ajax({
				url: "/listProjects",
				type: "GET",
				statusCode: {
					401: function (data){
						data = JSON.parse(data.responseText);
						if (typeof cbError === "function") {
						   cbError(data.error);
						}
					}
				},
				success: function(data){
					app.projects = data;
					if (typeof cbSuccess === "function") {
						cbSuccess();
					}
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
					app.layout.content.show(new Project({app: app}));
				});
			}
		},
		loadProject: function(projectname, scenarioname, cbError, cbSuccess){
			console.log("loading project and scenario data for ", projectname, scenarioname);
			var app = this;
			$.ajax({
				url: "/readScenario/"+projectname+"/"+scenarioname,
				type: "GET",
				error: function (data){
					data = JSON.parse(data.responseText);
					cbError(data.error);
				},
				success: function(data){
					app.scenario = data;
					app.monitors.push(new Monitor({
						app: app
					}));
					cbSuccess();
				}
			});
		},
		showMonitor: function(){
			if (this.monitors.length > 0) {
				this.layout.content.show(this.monitors[0]);
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