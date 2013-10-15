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
					console.log("read project", project)
					var proj = db.kv(project.id);
					if(!proj){
						cb(["Project not found"]);
					}else{
						cb(undefined, proj);
					}
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
					var projects = db.getDb(),
						project,
						projectsList = [];
					for (project in projects) {
						// projectsList.push({
						// 	id: projects[project].id,
						// 	projectname: projects[project].projectname
						// });
 						projectsList.push(projects[project]);
					}
					cb(undefined, projectsList);
				}
			};
		}
	};
}());