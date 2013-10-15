var exports = module.exports = (function(){
	var fs = require("fs"),
		xmlparser = require('xml2json'),
		pathjs = require('path'),
		dbs = {};

	return {
		connectDb: function (root, cb){
			if (dbs[root]===undefined){
				var db={}, 
					obj = {
						readScenario: function(projectname, scenarioname, cb) {
							// read xml scenario file 
							var xmlPath = pathjs.join(root, projectname, scenarioname, scenarioname+".xml");
							fs.lstat(xmlPath, function(err, stat){
								if (stat.isFile()){
									fs.readFile(xmlPath,function(err, data){
										try{
											data = xmlparser.toJson(data); 
											db.scenario = JSON.parse(data);
										}catch(e){
											cb("Error: Bad json: \n" + data + '\n' + e);
										}
										cb(undefined, db.scenario);
									});
								}
							});
						},
						getDirNamesSync : function(root) {
							var results = [];
							var files = fs.readdirSync(root);
							for(var i in files) {
								var path = root + files[i];
								var stat = fs.statSync(path);
								if (stat.isDirectory()) {
									results.push(files[i]);
								}
							}
							return results;
						},
						getFilesNamesSync : function(root, ext) {
						  var results = [];
						  var files = fs.readdirSync(root);
						  for(var i in files) {
							var path = root + '/' + files[i];
								var stat = fs.statSync(path);
								if (stat.isFile()) {
								  var filename = files[i];
								  if (ext != null) {
									var filenameSplit = filename.split('.');
									var extension = filenameSplit.length === 2 ? filenameSplit[1] : "";
									if (extension === ext) {
									  results.push(filename);
									}
								  }
								  else {
									results.push(filename);
								  }
								}
						  }
						  return results;
						},
						getDirNames : function(root, cb) {
							var results = [];
							fs.readdir(root, function(err, list) {
								if (err) {
									return cb(err);
								}
								var pending = list.length;
								if (!pending) {
									return cb(null, results);
								}
								list.forEach(function(item) {
									var itemPath = root + '/' + item;
									fs.stat(itemPath, function(err, stat) {
										if (stat && stat.isDirectory()) {
											results.push(item);
										} else {
											// skip files
										}
										if (!--pending) {
											cb(null, results);
										}
									});
								});
							});  
						},
						listAll : function(dir, cb) {
							var results = [];
							fs.readdir(dir, function(err, list) {
								if (err) {
									return cb(err);
								}
								var pending = list.length;
								if (!pending) {
									return cb(null, results);
								}
								list.forEach(function(file) {
									file = dir + '/' + file;
									fs.stat(file, function(err, stat) {
										if (stat && stat.isDirectory()) {
											obj.listAll(file, function(err, res) {
												results = results.concat(res);
												if (!--pending) {
													cb(null, results);
												}
											});
										} else {
											results.push(file);
											if (!--pending) {
												cb(null, results);
											}
										}
									});
								});
							});  
						},
						getDb: function(){
							return db;
						},
						init : function(projects) {
							db.projects = projects;
							console.log("db: ", db);
							dbs[root]=obj;
							cb(undefined, obj);
						}
					};

					fs.lstat(root, function(err, stat){
						if (err) {
							dbs[root]=obj;
							cb(obj);
							return;
						} 
						else {
							if (stat.isDirectory()) {
								// get directory names for project names
								obj.getDirNames(root,function(err, data){
									var projects = [],
										project = {},
										pending = data.length;
									for (var dir in data) {
										// for each project get directory names for scenario names
										var projectpath = pathjs.join(root, data[dir]);
										obj.getDirNames(projectpath,function(err, scenarios){
											projects.push({
												"id": data[dir],
												"projectname": data[dir],
												"scenarios": scenarios
											});
											if (!--pending) {
												obj.init(projects);
											}
										});
									}
								});
							}
						}
					});	
			} 
			else {
				cb(undefined, dbs[root]);
			}
			return;
		}
	};
}());
