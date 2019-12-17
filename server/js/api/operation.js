// Constants
const ALLOW_ALL = function() { return true; };
const DENY_ALL = function() { return false; };

// Import classes
const Result = require("./result.js");

// Class: Operation defines API operations
class Operation {

	constructor(method, action, authorization) {
		const self = this;

		self._method = method;
		self._action = action;

		// Set authorization
		if(authorization === false) {
			self._authorization = DENY_ALL;
		} else if(authorization === true) {
			self._authorization = ALLOW_ALL;
		} else {
			self._authorization = authorization;
		}

		// Validate operation
		if(!self._action.call) {
			throw new Error("Failed to create Operation: action is not a callable function");
		}
		if(!self._authorization || !self._authorization.call) {
			throw new Error("Failed to create Operation: authorization is not a callable function");
		}
	}

	// Public instance methods
	perform(request) {
		const self = this;

		// Validate method
		if(self._method !== request.getMethod()) {
			return Result.methodNotAllowed;
		}

		// Validate authorization
		try {
			if(!self._authorization(request)) {
				return Result.unauthorized;
			}
		} catch(e) {
			console.error("Failed to validate API operation: ", e);
			return Result.internalError;
		}

		// Perform action
		try {
			let data = self._action(request);
			if(data === undefined) {
				throw new Error("No response from operation " + request.getMethod() + " on " + request.getPath());
			} else if(Result.isInstance(data)) {
				// Data is already a Result instance
				return data;
			} else if(data.then) {
				// Data is a Promise, just answer it
				return data;
			} else {
				// Turn data into Result instance
				return Result.fromData(data);
			}
		} catch(e) {
			console.error("Failed to perform API operation: ", e);
			return Result.internalError;
		}
	}
}

module.exports = Operation;
