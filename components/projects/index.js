(function() {
	var projectModel = require("./models/project");

	module.exports = {
		init: function(db) {
			return {
				create: function(project, cb) {
					projectModel.validate(project, function(err, proj) {
						var project;
						if (err) {
							cb(err);
						} else {
							project = projectModel.normalize(proj);
							if (db.kv(project.id)) {
								cb(["Project already exists"]);
							} else {
								db.kv(project.id, project, cb);
							}
						}
					});
				},
				read: function(project, cb){
					var projectname = project.projectname;
					var scenarioname = project.scenarioname;
					db.readScenario(projectname, scenarioname, function(err, scenario) {
						if(!scenario){
							cb(["Scenario not found"]);
						}else{
							cb(null, db.getDb().scenario);
						}
					});
				},
				update: function(project, cb){
					projectModel.validateUpdate(project, function(err, proj){
						var project;
						if(err){
							cb(err);
						}else{
							project = projectModel.normalize(proj);
							if(project.id !== proj.oldId){
								if(db.kv(project.id)){
									cb(["Project already exists"]);
								}else{
									db.del(proj.oldId, function(err){
										if(err){
											cb(err);
										}else{
											db.kv(project.id, project, cb);
										}
									});
								}
							}else{
								db.kv(project.id, project, cb);
							}
						}
					});
				},
				del: function(project, cb){
					project.id = project.id.toLowerCase();
					db.del(project.id, cb);
				},
				list: function(cb) {
					cb(undefined, db.getDb().projects);
				}
			};
		}
	};
}());