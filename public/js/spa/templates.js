this["JST"] = this["JST"] || {};

this["JST"]["board.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h1>Welcome to Videre!</h1>';}return __p};

this["JST"]["hello.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h1>Hello App!</h1>';}return __p};

this["JST"]["layout.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="app">\n\t<div id="menu"></div>\n\t<div id="content"></div>\n</div>';}return __p};

this["JST"]["login.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="login form">\n  <div class="message">\n  </div>\n  <form class="form-horizontal">\n    <div class="control-group">\n      <label class="control-label" for="inputUsername">Username</label>\n      <div class="controls">\n        <input type="text" class="input username" id="inputUsername" placeholder="Username">\n      </div>\n    </div>\n    <div class="control-group">\n      <label class="control-label" for="inputPassword">Password</label>\n      <div class="controls">\n        <input type="password" class="input password" id="inputPassword" placeholder="Password">\n      </div>\n    </div>\n    <div class="control-group">\n      <div class="controls">\n        <button type="submit" class="btn login">Login</button>\n      </div>\n    </div>\n  </form>\n</div>';}return __p};

this["JST"]["map.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="map_item"></div>\n';}return __p};

this["JST"]["menu.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="navbar navbar-default">\n  <a class="brand" href="#">Videre</a>\n  <ul class="nav navbar-nav"  role="navigation">\n    <li class="active"><a href="#home">Home</a></li>\n    <li><a href="#project">Project</a></li>\n    <li><a href="#realtime">Real-time</a></li>\n    <li><a href="#monitor">Monitor</a></li>\n    <li><a href="#prediction">Prediction</a></li>\n    <li><a href="#login">Login</a></li>\n  </ul>\n</div>\n';}return __p};

this["JST"]["monitorlayout.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h1>Monitor view</h1>\n<div class="monitor">\n\t<div class="map container"></div>\n\t<div class="chart container"></div>\n</div>';}return __p};

this["JST"]["prediction.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h1>Prediction view</h1>';}return __p};

this["JST"]["project.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="select_project form">\n\t<div id="bla" class="message">\n\t</div>\n\t<form class="form-horizontal">\n\t  <div class="control-group">\n\t    <label class="control-label" for="selectProjectname">Project</label>\n\t    <div class="controls">\n\t      <select class="select projectname" id="selectProjectname"> <option value="">Select project</option></select>\n\t    </div>\n\t  </div>\n\t  <div class="control-group">\n\t    <label class="control-label" for="selectScenarioname">Scenario</label>\n\t    <div class="controls">\n\t      <select class="select scenarioname" id="selectScenarioname" placeholder="Select scenario"></select>\n\t    </div>\n\t  </div>\n\t  <div class="control-group">\n\t    <div class="controls">\n\t      <button type="submit" class="btn load">Load</button>\n\t    </div>\n\t  </div>\n\t</form>\n</div>\n';}return __p};