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
		},
		showBoard: function(){
			this.layout.content.show(new Board());
		},
		showProjectForm: function(){
			console.log("get project list and render project selection view, this", this)
			this.layout.content.show(new Project());
		},
		loadProject: function(){
			console.log("load project and scenario data")
		},
		showMonitor: function(){
			this.layout.content.show(new Monitor());
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