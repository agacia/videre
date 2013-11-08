this["JST"] = this["JST"] || {};

this["JST"]["blank.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h3 class="title"></h3>\n<h5 class="message"></h6>\n<p class="details"></p>\n';}return __p};

this["JST"]["board.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h2>Welcome to Videre!</h2>';}return __p};

this["JST"]["hello.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h1>Hello App!</h1>';}return __p};

this["JST"]["layout.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="app">\n\t<div id="menu"></div>\n\t<div id="content" class="container"></div>\n</div>';}return __p};

this["JST"]["login.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="login form">\n  <div class="message">\n  </div>\n  <form class="form-horizontal">\n    <div class="control-group">\n      <label class="control-label" for="inputUsername">Username</label>\n      <div class="controls">\n        <input type="text" class="input username" id="inputUsername" placeholder="Username">\n      </div>\n    </div>\n    <div class="control-group">\n      <label class="control-label" for="inputPassword">Password</label>\n      <div class="controls">\n        <input type="password" class="input password" id="inputPassword" placeholder="Password">\n      </div>\n    </div>\n    <div class="control-group">\n      <div class="controls">\n        <button type="submit" class="btn login">Login</button>\n      </div>\n    </div>\n  </form>\n</div>';}return __p};

this["JST"]["map.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="route_selection">\n\t<h5>Available routes:</h5>\n\t<span></span>\n</div>\n<div class="map_item"></div>\n';}return __p};

this["JST"]["menu.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="navbar navbar-default">\n  <!-- <a class="brand" href="#">Videre</a> -->\n  <ul class="nav navbar-nav"  role="navigation">\n    <li class="active"><a href="#home">Home</a></li>\n    <li><a href="#project">Projects</a></li>\n    <li><a href="#realtime">Real-time</a></li>\n    <li><a href="#monitor">Monitor</a></li>\n    <li><a href="#prediction">Prediction</a></li>\n    <li><a href="#login">Login</a></li>\n  </ul>\n</div>\n';}return __p};

this["JST"]["monitorlayout.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="monitor">\n\t<div class="message">\n\t</div>\n\t<div>\t\t\n\n\t<div class="row">\n\t\t<form class="form-horizontal">\n\t\t\t<div class="control-group">\n\t\t\t\t<label class="control-label" for="selectAvailableDate">Date:</label>\n\t\t\t\t<div class="controls">\n\t\t\t\t\t<select class="select availabledate" name="selectAvailableDate"></select>\n\t\t\t\t\t<button type="submit" class="btn load">Load</button>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</form>\n\t\t<!-- <div class="control-group">\n\t\t  <label class="control-label" for="calender">Date:</label>\n\t\t  <div class="controls input-append date calender" data-date-format="dd-mm-yyyy">\n\t\t  \t<input class="span2" name="calender" type="text" />\n\t\t  \t<span class="add-on"><i class="glyphicon glyphicon-th"></i></span>\n\t\t  </div>\n\t\t</div> -->\n\t\t<label>Simulation time:</label>\n\t\t<span class="clock">CLOCK</span>\n\t</div>\n\t<div class="player">\n\t\t<span class="btn-group playerBtn" data-toggle="buttons">\n\t        <label class="btn btn-primary "><input type="radio" name="options" class="playBtn"><i class="glyphicon glyphicon-play"></i></input></label>\n\t        <label class="btn btn-primary active"><input type="radio" name="options" class="pauseBtn"> <i class="glyphicon glyphicon-pause"></i></input></label>\n        </span>\n\t</div>\n\n\t<div class="row">\n\t\t<div class="col-xs-6">\n\t\t\t<div id="slider-wrapper"><div id="slider"></div></div>\n\t\t\t<div class="map">MAP CONTAINER</div>\n\t\t</div>\n\t\t<div class="col-xs-6">\n\t\t\t<div class="chart">CHART CONTAINER</div>\n\t\t\t<div id="timebrush"></div>\n\t\t\t<div id="contourplot"></div>\n\t\t</div>\n\t</div>\n\t\n\t\n\t\n</div>';}return __p};

this["JST"]["prediction.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h2>Prediction view</h2>';}return __p};

this["JST"]["project.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<h4>Projects:</h4>\n<div class="select_project form">\n\t<div class="message">\n\t</div>\n\t<form class="form-horizontal">\n\t  <div class="control-group">\n\t    <label class="control-label" for="selectProjectname">Project</label>\n\t    <div class="controls">\n\t      <select class="select projectname" id="selectProjectname"></select>\n\t    </div>\n\t  </div>\n\t  <div class="control-group">\n\t    <label class="control-label" for="selectScenarioname">Scenario</label>\n\t    <div class="controls">\n\t      <select class="select scenarioname" id="selectScenarioname" placeholder="Select scenario"></select>\n\t    </div>\n\t  </div>\n\t  <div class="control-group">\n\t  \t<div class="controls">\n\t      <button type="submit" class="btn load">Load</button>\n\t  \t</div>\n\t  </div>\n\t</form>\n</div>\n';}return __p};

this["JST"]["realtimelayout.html"] = function(obj) {obj || (obj = {});var __t, __p = '', __e = _.escape;with (obj) {__p += '<div class="monitor">\n\t<div class="message">\n\t</div>\n\t<div class="date">\n\t\t<label>Current time:</label>\n\t\t<span class="clock">CLOCK</span>\n\t</div>\n\t<div class="player">\n\t\t<span class="btn-group playerBtn" data-toggle="buttons">\n\t        <label class="btn btn-primary active"><input type="radio" name="options" class="playBtn"><i class="glyphicon glyphicon-play"></i></input></label>\n\t        <label class="btn btn-primary"><input type="radio" name="options" class="pauseBtn"> <i class="glyphicon glyphicon-pause"></i></input></label>\n        </span>\n\t</div>\n\t<div class="map">MAP CONTAINER</div>\n\t<div class="chart">CHART CONTAINER</div>\n</div>';}return __p};