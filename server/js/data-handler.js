// Constants
var PATH_SEPARATOR = "/";
var LEADING_PATH_SEPARATORS_REGEX = /^\/+/;

// Globals
var dataStorage = require("./data-storage");
var handlers = [
	{
		path: "/api/projects",
		responseData: function() { return dataStorage.getAllProjects(); }
	},
	{
		path: "/api/projects/:projectId",
		responseData: function(params) { return dataStorage.getProjectWithId(params); }
	},
	{
		path: "/api/projects/:projectId/members",
		responseData: function(params) { return dataStorage.getMembersForProjectWithId(params); }
	}
];

// Data request handler
module.exports = function(request, response) {
	var url = request.url;
	console.log("Handling request " + url);

	// Try handlers until request is handled successfully
	handlers.some(function(handler) {
		return matchesUrl(url, handler.path, function(params) {

			// Found matching handler, create response data
			var data = handler.responseData(params);
			if(data !== undefined) {

				// Send response
				response.writeHead(200, { "Content-Type": "application/json" }); 
				response.end(JSON.stringify(data));
			} else {

				// No data found
				response.writeHead(404);
				response.end("Resource not found");
			}
		});
	});

	// No valid handler found
	response.writeHead(404);
	response.end("Resource not found");
};

// URL mapping
function matchesUrl(url, path, callback) {

	// Iterate over path segments
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
				return false;	// No match, fail
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

	// Perform callback on valid result
	if(result !== false) {
		callback(result);
	}

	return result;
}
