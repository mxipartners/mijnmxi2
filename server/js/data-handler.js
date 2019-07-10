// Constants
var PATH_SEPARATOR = "/";
var LEADING_PATH_SEPARATORS_REGEX = /^\/+/;

// Globals
var resultCodes = require("./result-codes");
var dataStorage = require("./data-storage");
var users = require("./users");
var handlers = [
	{
		path: "/api/projects",
		actions: {
			GET: function() { return dataStorage.getAllProjects() || resultCodes.noResourceFound; }
		}
	},
	{
		path: "/api/projects/:projectId",
		actions: {
			GET: function(params) { return dataStorage.getProjectWithId(params) || resultCodes.noResourceFound; }
		}
	},
	{
		path: "/api/projects/:projectId/members",
		actions: {
			GET: function(params) { return dataStorage.getMembersForProjectWithId(params) || resultCodes.noResourceFound; }
		}
	},
	{
		path: "/api/users",
		actions: {
			POST: function(params, data) {

				// Validate input
				if(Object.keys(data).length !== 2 || !users.validateEmail(data.email) || !users.validatePassword(data.password)) {
					return resultCodes.invalidData;
				}

				// Replace password by password hash
				data.passwordHash = users.generatePasswordHash(data.password);
				delete data.password;

				// Add activation token and expiration
				data.activationToken = users.generateActivationToken();
				data.activationExpiration = users.generateActivationExpiration();

				// Store user data
				var result = dataStorage.addUser(data);
				if(result && result.id) {
					// Send activation mail
					users.sendActivationToken(data.email, data.activationToken);
				}
				return result || resultCodes.invalidData;
			},
			PUT: function(params, data) {

				// Validate input
				if(Object.keys(data).length !== 1 || !data.activationToken) {
					return resultCodes.invalidData;
				}

				// Add current time parameters
				data.now = Date.now();

				// Update user data
				return dataStorage.activateUser(data) || resultCodes.invalidData;
			}
		}
	},
	{
		path: "/api/sessions",
		actions: {
			POST: function(params, data) {

				// Validate input
				if(Object.keys(data).length !== 2 || !data.email || !data.password) {
					return resultCodes.invalidData;
				}

				// Keep password in temporary var and remove from request data
				var password = data.password;
				delete data.password;

				// Retrieve user
				var user = dataStorage.getUser(data);
				if(!user || !users.comparePasswordHash(password, user.passwordHash)) {
					return resultCodes.invalidData;
				}

				// Create session with user id, token and expiration
				var session = {
					userId: user.id,
					token: users.generateSessionToken(),
					expiration: users.generateSessionExpiration()
				};

				// Store session data
				return dataStorage.addSession(session) || resultCodes.invalidData;
			}
		}
	}
];

// Data request handler
function dataHandler(request, response) {
	var url = request.url;
	console.log("Handling " + request.method + " request " + url);

	// Find (first) matching handler (using array.reduce)
	var matchResult = handlers.reduce(function(result, handler) {

		// If already have a result, answer it
		if(result) {
			return result;
		}

		// Find next match
		var params = matchesUrl(url, handler.path);
		if(params === false) {

			// No match found
			return false;
		}

		// Found match
		return {
			handler: handler,
			params: params
		};
	}, false);

	// Stop if no match is found
	if(!matchResult) {

		// No handler matches URL
		response.writeHead(404);
		response.end("Resource not found");
		return;
	}

	// Check presence of correct handler action
	var action = matchResult.handler.actions[request.method];
	if(!action) {

		// Invalid method
		response.writeHead(405);
		response.end("Method not allowed");
		return;
	}

	// Collect request data and perform handler action
	withRequestDataDo(request, function(error, requestData) {

		// Validate result
		if(error) {
			console.error("Internal Error. Failed to retrieve data from request.", error);
			response.writeHead(500);
			response.end("Internal error");
			return;
		}

		// Perform handler action
		var responseData = action.call(null, matchResult.params, requestData);
		if(!responseData) {

			// No response data found
			response.writeHead(404);
			response.end("Resource not found");
			return;
		}

		// Send response data
		response.writeHead(200, { "Content-Type": "application/json" }); 
		response.end(JSON.stringify(responseData));
	});
}

// Match url against provided path
// Answer a parameter object for the match found (may be empty object in case no parameters are present on url)
// For example:
//     matchesUrl("/api/projects/123/members/2", "/api/projects/:projectId/members/:memberId") =>
//     { "projectId": 123, "memberId": 2 }
function matchesUrl(url, path) {

	// Iterate over path segments (using array.reduce)
	var pathSegments = path
		.replace(LEADING_PATH_SEPARATORS_REGEX, "")
		.split(PATH_SEPARATOR)
	;
	var result = pathSegments.reduce(function(result, pathSegment) {

		// Stop if already failed
		if(result === false) {
			return false;
		}

		// Validate url (should start with path separator)
		if(!url.startsWith(PATH_SEPARATOR)) {
			return false;
		}

		// Remove leading path separator(s)
		url = url.replace(LEADING_PATH_SEPARATORS_REGEX, "");

		// Check for parameter or path segment
		if(pathSegment.startsWith(":")) {

			// Retrieve parameter from url
			var valueEndIndex = url.indexOf(PATH_SEPARATOR);
			if(valueEndIndex < 0) {
				valueEndIndex = url.length;
			}
			var value = url.slice(0, valueEndIndex);	// Parameter value
			if(value.length === 0) {

				// No value found, fail
				return false;
			}

			// Store parameter
			var name = pathSegment.slice(1);		// Parameter name
			result[name] = decodeURIComponent(value);

			// Remove parameter from url
			url = url.slice(valueEndIndex);
		} else {

			// Match path segment
			if(!url.startsWith(pathSegment)) {

				// No match, fail
				return false;
			}

			// Remove path segment and move on to next segment
			url = url.slice(pathSegment.length);
		}

		return result;
	}, {});

	// Url should be empty (no trailing path separators allowed)
	if(url.length !== 0) {
		return false;
	}

	return result;
}

// Extract JSON data from request
function withRequestDataDo(request, callback) {

	// Validate we received JSON data
	if(request.headers["content-type"] === "application/json") {

		// Extract data and call callback function with result
		var data = "";
		request.on("data", function(chunk) { data += chunk; });
		request.on("end", function() {
			callback(null, JSON.parse(data));
		});
		request.on("error", function(error) {
			callback(error, null);
		});
	} else {

		// Call callback with 'undefined' (ie no request data present)
		callback(null, undefined);
	}
}

// Export data handler
module.exports = dataHandler;
