(function() {
	var getParamNames = function(func) {
			var funStr = func.toString();
			return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
		},
		createAPI = function(component, options) {
			var API = {};
			options = options || {};
			if (!component) {
				return {};
			}
			for (var method in component) {
				if (component.hasOwnProperty(method)) {
					if (typeof component[method] === "function") {
						API[method] = createMiddleware(method, component, options);
					}
				}
			}

			return API;
		},
		createMiddleware = function(name, component, options) {			
			return function(req, res, next) {
				var params = [];
				if (component[name].length === 2) {
					if (req.method === "GET") {
						// xxx added params to handle ajax routes
						if (req.params) {
							params.push(req.params);
						} else {
							params.push(req.query);
						}
					}
					else {
						params.push(req.body);
					}
				}
				params.push(function(err, ret) {
					if (err) {
						res.status(500);
						res.json({
							"error": err
						});
					} else {
						if (ret) {
							res.json(ret);
						} else {
							res.json({
								"status": "ok"
							});
						}
					}
				});
				component[name].apply(component, params);
			};

		};

	module.exports = {
		createAPI: createAPI
	};
}());