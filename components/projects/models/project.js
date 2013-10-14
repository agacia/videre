(function(){
	var model = require("../../../libs/models"),
		check = model.check,
		normalize = model.normalize;
	module.exports = {
		validate: function(obj, cb){
			var errors = check(obj).notFalsy("projectname").isString("projectname").notFalsy("scenarios").isArray("scenarios");
			//.notFalsy("scenarios").isArray("scenarios");
			if(errors.length === 0){
				errors = undefined;
			}
			cb(errors, obj);
		},
		normalize: function(obj){
			console.log("in normalize");
			return normalize(obj).copy("projectname").toLower("projectname").toSlang("projectname", "id", "scenario").end();
		},
		validateUpdate: function(obj, cb){
			var errors = check(obj).notFalsy("oldId").notFalsy("projectname").isString("oldId").isString("projectname");
			if(errors.length === 0){
				errors = undefined;
			}
			cb(errors, obj);		
		}
	};
}());