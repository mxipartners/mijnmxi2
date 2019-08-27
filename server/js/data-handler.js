// Constants
var PATH_SEPARATOR = "/";
var LEADING_PATH_SEPARATORS_REGEX = /^\/+/;

// Globals
var resultCodes = require("./result-codes");
var dataStorage = require("./data-storage");
var users = require("./users");

// Handlers defines a mapping between the combination of API URL & HTTP method and a function performing the API operation.
// Handler functions should answer a HTTP response code and (optionally) response content. See the file "./result-codes.js".
var handlers = [
	{
		isSessionRequired: true,
		path: "/api/projects",
		actions: {
			GET: function(/* params */) { return dataStorage.getAllProjects() || resultCodes.noResourceFound; }
		}
	},
	{
		isSessionRequired: true,
		path: "/api/projects/:projectId",
		actions: {
			GET: function(params) { return dataStorage.getProject(params) || resultCodes.noResourceFound; }
		}
	},
	{
		isSessionRequired: true,
		path: "/api/projects/:projectId/members",
		actions: {
			GET: function(params) { return dataStorage.getMembersForProject(params) || resultCodes.noResourceFound; }
		}
	},
	{
		isSessionRequired: false,
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
			PATCH: function(params, data) {

				// Validate input
				if(!data || !data.operation) {
					return resultCodes.invalidData;
				}

				// Distinguish between operations
				if(data.operation === "activate") {

					// Validate input
					delete data.operation;
					if(Object.keys(data).length !== 1 || !data.activationToken) {
						return resultCodes.invalidData;
					}

					// Add current time parameters
					data.now = Date.now();

					// Update user data
					return dataStorage.activateUser(data) || resultCodes.invalidData;
				} else if(data.operation === "passwordForgotten") {

					// Validate input
					delete data.operation;
					if(Object.keys(data).length !== 1 || !users.validateEmail(data.email)) {
						return resultCodes.invalidData;
					}

					// Add password reset token and expiration
					data.passwordResetToken = users.generatePasswordResetToken();
					data.passwordResetExpiration = users.generatePasswordResetExpiration();

					// Update user data
					var result = dataStorage.passwordForgotten(data);
					if(result && result.success) {

						// Send password reset mail
						users.sendPasswordResetToken(data.email, data.passwordResetToken);
					}
					return result || resultCodes.invalidData;
				} else if(data.operation === "resetPassword") {

					// Validate input
					delete data.operation;
					if(Object.keys(data).length !== 2 || !data.passwordResetToken || !users.validatePassword(data.password)) {
						return resultCodes.invalidData;
					}

					// Replace password by password hash
					data.passwordHash = users.generatePasswordHash(data.password);
					delete data.password;

					// Add current time parameters
					data.now = Date.now();

					// Update user data
					return dataStorage.resetPassword(data) || resultCodes.invalidData;
				}
			}
		}
	},
	{
		isSessionRequired: false,
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
			},
			DELETE: function(/* params */) {
				var params = { now: Date.now() };
				return dataStorage.deleteSessions(params) || resultCodes.invalidData;
			}
		}
	},
	{
		isSessionRequired: true,
		path: "/api/sessions/:sessionToken",
		actions: {
			DELETE: function(params) { return dataStorage.deleteSession(params) || resultCodes.invalidData; }
		}
	}
];

// Data request handler
function dataHandler(request, response) {
	var url = request.url;
	console.log("Handling " + request.method + " request " + url);

	// Find (first) matching handler (using array.reduce) without considering the HTTP method
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

	// Check presence of correct handler action considering the HTTP method requested
	var action = matchResult.handler.actions[request.method];
	if(!action) {

		// Invalid method
		response.writeHead(405);
		response.end("Method not allowed");
		return;
	}

	// Check if session is required (and present)
	if(matchResult.handler.isSessionRequired) {
		var isValidSession = false;
		var sessionToken = request.headers["x-session-token"];
		if(sessionToken) {
			var updateSessionData = {
				token: sessionToken,
				now: Date.now(),
				expiration: users.generateSessionExpiration()
			};
			var updateSessionResult = dataStorage.updateSession(null, updateSessionData);
			if(updateSessionResult && updateSessionResult.success) {

				// Only after successful update it is clear that session is valid (do not optimize this code, it will lower the understandability)
				isValidSession = true;
			}
		}

		// If no valid session, fail
		if(!isValidSession) {
			response.writeHead(401);
			response.end("Unauthorized");
			return;
		}
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

		// Perform handler action (send both params and data, although later can be empty or null)
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
			try {
				var parsedData = data.length > 0 ? JSON.parse(data) : null;
				callback(null, parsedData);
			} catch(error) {
				callback(error, null);
			}
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
