(function() {
	var  simple = require("./components/simple/routes.js")
		,dummy = require("./components/dummy/index.js")
		,middlewarize = require("./libs/APICreator.js")
		,Users = require("./components/users/index.js")
		,Projects = require("./components/projects/index.js")
		,RestfulAuth = require("./components/restfulauth/index.js");

	module.exports = {
		load: function(app, dbs) {
			var users = Users.init(dbs["sampleUsers"])
				projects = Projects.init(dbs["sampleProjects"])
				,restfulauth = RestfulAuth.init(users);

			users.api = middlewarize.createAPI(users);
			projects.api = middlewarize.createAPI(projects);

			app.post("/api/auth", [restfulauth], dummy.ok);
			app.post("/createUser", users.api.create);
			app.get("/createUser", users.api.create);
			app.get("/readUser", users.api.read);
			app.get("/updateUser", users.api.update);
			app.get("/deleteUser", users.api.del);
			app.get("/listUsers", users.api.list);
			app.get("/hello", simple.helloWorld);

			app.get("/listProjects", projects.api.list);
			app.get("/readScenario/:projectname/:scenarioname", projects.api.read);
		}
	};
}());