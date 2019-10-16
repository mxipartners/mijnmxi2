// Constants
const PATH_SEPARATOR = "/";
const LEADING_PATH_SEPARATOR_REGEX = /^\//;
const WHITESPACE = /\s/;

// Import classes
const Result = require("./result.js");

// Class: Endpoint defines an API endpoint
class Endpoint {

	constructor(path) {
		const self = this;

		self._path = path;
		self._pathSegments = path
			.replace(LEADING_PATH_SEPARATOR_REGEX, "")
			.split(PATH_SEPARATOR)
		;
		self._operations = [];

		// Validate endpoint
		if(!LEADING_PATH_SEPARATOR_REGEX.test(self._path)) {
			throw new Error("Failed to create Endpoint: path should have a leading " + PATH_SEPARATOR);
		}
		self._pathSegments.forEach(function(pathSegment) {
			if(pathSegment.length === 0 || WHITESPACE.test(pathSegment)) {
				throw new Error("Failed to create Endpoint: path contains whitespace or empty segments");
			}
		});
	}

	// Public instance methods
	handle(request) {
		const self = this;

		var requestParameters = self._requestParametersFromPath(request.getPath());
		if(!requestParameters) {
			return Result.noResourceFound;
		}
		request.setParameters(requestParameters);

		// Perform first matching operation
		var result = null;
		self._operations.some(function(operation) {
			var operationResult = operation.perform(request);
			result = Result.mostSpecific(result, operationResult);

			return result.isOk();
		});

		return result;
	}
	getPath() {
		const self = this;

		return self._path;
	}
	addOperation(operation) {
		const self = this;

		self._operations.push(operation);
	}

	// Private instance methods
	_requestParametersFromPath(requestPath) {
		const self = this;

		// Match receiver's path against provided request path
		// Answer a parameter object if the request path matches the receiver (may be empty object in case no parameters are present on path)
		// If no match is found answers false.
		// For example:
		//     Existing paths:
		//         "/api/projects"
		//         "/api/projects/:projectId"
		//         "/api/projects/:projectId/members/:memberId"
		//
		//     _requestParametersFromPath("/api/projects/123/members/2") =>
		//         { "projectId": 123, "memberId": 2 }
		//     _requestParametersFromPath("/api/projects") =>
		//         {}
		//     _requestParametersFromPath("/api/users") =>
		//         false

		// Pedantic check for leading separator
		if(!LEADING_PATH_SEPARATOR_REGEX.test(requestPath)) {
			return false;
		}

		// Iterate over path segments
		var apiPathSegments = self._pathSegments;
		var requestPathSegments = requestPath
			.replace(LEADING_PATH_SEPARATOR_REGEX, "")
			.split(PATH_SEPARATOR)
		;

		// Paths should have same number of segments
		if(apiPathSegments.length !== requestPathSegments.length) {
			return false;
		}

		// Process the path segments one by one
		var parameters = {};
		var success = apiPathSegments.every(function(apiPathSegment, index) {
			var requestPathSegment = requestPathSegments[index];

			// Check for parameter or path segment
			if(apiPathSegment.startsWith(":")) {

				// Store parameter
				var name = apiPathSegment.slice(1);	// Remove leading ":"
				var value = decodeURIComponent(requestPathSegment);
				parameters[name] = value;

			// Check for matching segment
			} else if(apiPathSegment !== requestPathSegment) {
				return false;
			}
			return true;
		});

		// Answer false if match is unsuccessful
		if(!success) {
			return false;
		}

		return parameters;
	}
}

module.exports = Endpoint;
