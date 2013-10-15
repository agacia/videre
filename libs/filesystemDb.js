(function () {
	var fsStore = require("./filesystemStore.js");
	module.exports = {
		"connect": function (url, cb){
			var arr = url.split(":"),
				type = arr[0];
			switch(type){
				case "dir":
					fsStore.connectDb(arr[1], cb);
				break;
				default:
				cb("Error: Unknown Type " + url + " Usage: [type]:[url] ");
			}
		}
	};
}());