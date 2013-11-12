var exports = module.exports = (function(){
	var fs = require("fs"),
		xmlparser = require('xml2json'),
		csvparser = require('csv'),
		d3 = require('d3'),
		pathjs = require('path'),
		dbs = {};
	return {
		connectDb: function (root, cb){
			if (dbs[root]===undefined){
				var db={},
					realTimeFolderName = "real_time", 
					dataFolderName = "data",
					dataFileExt = "txt",
					eventsFolderName = "events",
					obj = {
						readScenarioData: function(projectname, scenarioname, date, cb) {
							// read xml scenario file 
							var scenarioPath = pathjs.join(root, projectname, scenarioname, realTimeFolderName, date);
							var jsonResponse = { "status" : "success" }
							jsonResponse.data = { "data" : "dataarray"}
							jsonResponse.events = { "events" : "dataarray"}
							var dataPath = pathjs.join(scenarioPath, dataFolderName);
							// console.log("reading folder ", dataPath);	
							obj.readDataFolder(dataPath, function(error, data) {
								db.scenarioData = data;
								cb(error, data);
							});
						},
						readDataFolder: function(path, cb) {
							try {
								var dataFilenames = obj.getFilesNamesSync(path, dataFileExt);
								console.log("reading data files ", dataFilenames);
								var jsonArray = []
								for (var i in dataFilenames) {
									var filepath = pathjs.join(path, dataFilenames[i]);
									var stats = fs.lstatSync(filepath);
									if (stats.isFile()) {
										var dataTvs = fs.readFileSync(filepath);
										var data = d3.tsv.parseRows(dataTvs.toString());
										jsonArray.push(
										{
											"file" : filepath,
											"fileName": dataFilenames[i],
											"data" : data
										});
										if (jsonArray.length == dataFilenames.length) {
											cb(undefined, jsonArray);
										}
									}
								}
							} catch(e) {
								cb("Error: " + e);
							}
										// data.forEach(function(d) {
										// 	var timeStampJSON = {}
										// 	timeStampJSON.type = type;
										// 	timeStampJSON.time = datetime.valueOf();
										// 	timeStampJSON.data = {
										// 		"link_id" : d.id,
										// 		"density" : parseFloat(d.density),
										// 		"flow" : parseFloat(d.flow),
										// 		"speed" : parseFloat(d.speed),
										// 		"delay" : parseFloat(d.delay)
										// 	};
										// 	jsonData.push(timeStampJSON)
										// });
										// try {
											// var streamreader = fs.createReadStream()
											// var inputFile = path + "/" + dataFilenames[i];
											// var inStream = fs.createReadStream(inputFile);
											// console.log("in ", inStream)
											// fs.createWriteStream(path+'/sample.out')
											// csvparser()
											// 	.from.stream(fs.createReadStream(inputFile), { delimiter: '\t' })
											// 	.to.array(function(data){
											// 		console.log(data)
											// 	})
											// 	.transform(function(row){
											// 		// console.log("row", row);
											// 		row.unshift(row.pop());
											// 		return row;
											// 	})
											// 	.on('record', function(row,index){
											// 		// console.log('#'+index+' '+JSON.stringify(row));
											// 	})
											// 	.on('close', function(count){
											// 		// when writing to a file, use the 'close' event
											// 		// the 'end' event may fire before the file has been written
											// 		console.log('Number of lines: '+count);
											// 	})
											// 	.on('error', function(error){
											// 		console.log(error.message);
											// 	});
										// } catch(e) {
										// 	cb("Error: Bad file: " + e);
										// }
							// 		}
							// 	});
							// }
						},
						readLines: function(input, func) {
							var remaining = '';
							input.on('data', function(data) {
								remaining += data;
								var index = remaining.indexOf('\n');
								var last  = 0;
								while (index > -1) {
									var line = remaining.substring(last, index);
									last = index + 1;
									func(line);
									index = remaining.indexOf('\n', last);
								}
								remaining = remaining.substring(last);
							});

							input.on('end', function() {
								if (remaining.length > 0) {
									func(remaining);
								}
							});
						},
						readScenario: function(projectname, scenarioname, cb) {
							// read xml scenario file 
							var scenarioPath = pathjs.join(root, projectname, scenarioname);
							var xmlPath = pathjs.join(scenarioPath, scenarioname+".xml");
							fs.lstat(xmlPath, function(err, stat){
								if (stat.isFile()){
									fs.readFile(xmlPath,function(err, data){
										try{
											data = xmlparser.toJson(data); 
											if (data.name == "") {
												datan.name = scenarioname;
											}
											var scenarioJson = JSON.parse(data);
											db.scenario = obj.parseScenario(scenarioJson.scenario);
											db.scenario.realtime = obj.readAvailableDates(pathjs.join(scenarioPath, "real_time"));
											db.scenario.prediction = obj.readAvailableDates(pathjs.join(scenarioPath, "prediction"));
										}catch(e){
											cb("Error: Bad json: \n" + data + '\n' + e);
										}
										cb(undefined, db.scenario);
									});
								}
							});
						},
						parseScenario: function(data) {
							var scenario = {};
 							//scenario.old = data;
    						scenario.name = data.name;
    						scenario.id = data.id;
    						scenario.file_name = data.name;
    						scenario.networks = [];
							// read networks
							if (data.NetworkList.network && !data.NetworkList.network.length) {
								// only one network
								var network = obj.readNetwork(data.NetworkList.network)
								scenario.networks.push(network)
							}
							if (data.NetworkList.network && data.NetworkList.network.length && data.NetworkList.network.length > 0) {
								for (var i in data.NetworkList.network ) {
									var network = obj.readNetwork(data.NetworkList.network [i])
									scenario.networks.push(network)
								}
							}
							//read sensors
							scenario.sensors = []
							if (data.SensorList && data.SensorList.sensor && data.SensorList.sensor.length && data.SensorList.sensor.length > 0) {
								scenario.sensors = data.SensorList.sensor
							}
							//read events
							scenario.events = []   
							if (data.EventSet && data.EventSet.event && data.EventSet.event.length && data.EventSet.event.length > 0) {
								scenario.events = data.EventSet.event
							}
							//read controllers
							scenario.controllers = []
							if (data.ControllerSet && data.ControllerSet.controller && data.ControllerSet.controller.length && data.ControllerSet.controller.length > 0) {
								scenario.controllers = data.ControllerSet.controller 
							}
							if (scenario.networks.length > 0) {
								scenario.x_center = scenario.networks[0].x_center; // oerwrite global center point for the whole scenario
								scenario.y_center = scenario.networks[0].y_center; 
							}
							else {
								scenario.x_center = -122.42;
								scenario.y_center = 37.665;
							}
							scenario.zoom = 11; 
							scenario.routes = this.readRoutes(scenario);
							return scenario;
						},	
						readNetwork: function(net) {	
							var network= {};
							network.id = net.id;
							network.name = net.name
							network.x_center = net.position.point.lng;
							network.y_center = net.position.point.lat;
							// TODO read nodes
							network.nodes = net.NodeList.node;
							// decode google shapes
							network.links = {}
							network.links.type = "FeatureCollection"
							network.links.features= []
							links = net.LinkList.link
							for (var i in links) {
								feature = obj.createLinkFeature(links[i], network.nodes)
								network.links.features.push(feature)
							}
							return network;
						},
						createLinkFeature : function(link, nodes) {
							coordinates = []
							if (link.shape) {
								coordinates = obj.decodeLine(link.shape)
							}
							else {
								coordinates = [obj.getNodeCoordinates(link.begin.node_id, nodes), obj.getNodeCoordinates(link.end.node_id, nodes)]
							}
							feature = { 
								"type":"Feature", 
								"properties": {"id":link.id, "length":link.length, "lane_offset":link.lane_offset, "lanes":link.lanes, type:link.type, "begin_node_id" : link.begin.node_id, "end_node_id":link.end.node_id},
								"geometry": {"type":"LineString", "coordinates":coordinates}
							}
							return feature
						},
						readRoutes: function(scenario) {
							var routes = [];
							// mock if routes element does not exist in scenario
							if (!scenario.routes) {
								var route =    {
									"id": "route1",
									"name": "Freeway",
									linkIds: [],
									performance: []
								};
								var HOVroute =    {
									"id": "route2",
									"name": "HOV",
									linkIds: [],
									performance: []
								};
								var rampsRoute =    {
									"id": "route3",
									"name": "ramps",
									linkIds: [],
									performance: []
								}
								for (var i in scenario.networks) {
									var network = scenario.networks[i];
									for (var j in network.links.features) {
										link = network.links.features[j];
										if (link.properties.type == "freeway") {
											route.linkIds.push(link.properties.id);
										}
										if (link.properties.type == "HOV") {
											HOVroute.linkIds.push(link.properties.id);
										}
										if (link.properties.type == "onramp" || link.properties.type == "offramp") {
											rampsRoute.linkIds.push(link.properties.id);
										}
									}
								}
								routes = [route, HOVroute, rampsRoute];
							}
							// calculate offset of subsequent links 
							for (var i in routes) {
								routes[i].offsets = [];
								routes[i].links = [];
								var offset = 0;
								for (var j in routes[i].linkIds) {
									var link = this.getLinkFromProject(scenario.networks, routes[i].linkIds[j]);
									link.properties.offset = offset;
									offset += link.properties.length;
									routes[i].links.push(link);
								}
							}
							return routes;
						},
						getLinkFromProject: function(networks, linkId) {
							for (var i in networks) {
								for (var j in networks[i].links.features) {
									var link = networks[i].links.features[j];
									if (link.properties.id === linkId) {
										return link;
									}
								}
							}
						},
						readAvailableDates: function(dirPath) {
 							var availableDateFolders = obj.getDirNamesSync(dirPath);
							var availableDates = []
							for (var i in availableDateFolders) {
								var date = availableDateFolders[i];
								var year = date.slice(0,4);
								var month = +date.slice(4,6);
								var day = date.slice(6,8);
								var datetime = new Date(year, (month-1), day, 0, 0, 0, 0);
								availableDates.push({
									"folder": availableDateFolders[i],
									"date": datetime});
							}
							return availableDates;
						},
						getDirNamesSync: function(root) {
							var results = [];
							var files = fs.readdirSync(root);
							for(var i in files) {
								var path = pathjs.join(root, files[i]);
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
							var path = pathjs.join(root, files[i]);
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
						getNodeCoordinates : function(id, nodes) {
							coordinates = []
							for (var i in nodes) {
								node = nodes[i]
								if (node.id == id) {
									coordinates = [node.position.point.lng, node.position.point.lat]
									return coordinates
								}
							}
						},
						// This function is from Google's polyline utility.
						// https://developers.google.com/maps/documentation/utilities/polylinealgorithm
						decodeLine : function(encoded) {
							var len = encoded.length;
							var index = 0;
							var array = [];
							var lat = 0;
							var lng = 0;
							while (index < len) {
								var b;
								var shift = 0;
								var result = 0;
								do {
									b = encoded.charCodeAt(index++) - 63;
									result |= (b & 0x1f) << shift;
									shift += 5;
								} while (b >= 0x20);
								var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
								lat += dlat;
								shift = 0;
								result = 0;
								do {
									b = encoded.charCodeAt(index++) - 63;
									result |= (b & 0x1f) << shift;
									shift += 5;
								} while (b >= 0x20);
								var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
								lng += dlng;
								array.push([lng * 1e-5, lat * 1e-5]);
							}
							return array;
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
