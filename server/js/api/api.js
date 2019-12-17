// Import classes
const Request = require("./request");
const Endpoint = require("./endpoint");
const Operation = require("./operation");
const Result = require("./result");

// Class: API defines the full API
// API will handle requests send to endpoints and create appropriate response.
// An API endpoint can have a number of operations based on the request method used.
class API {

	constructor(endpointsCollection, resources) {
		const self = this;

		self._endpoints = [];
		self._resources = resources;

		if(endpointsCollection) {
			self.addEndpointsFromCollection(endpointsCollection);
		}
	}

	// Public instance methods
	handle(httpRequest, responseWriter) {
		const self = this;

		console.log("Handling " + httpRequest.method + " request " + httpRequest.url);

		// Create API Request from (HTTP) request
		let request = new Request(httpRequest, responseWriter, self.getResources());
		
		// Extract JSON data from request
		if(httpRequest.headers["content-type"] === "application/json") {

			// Extract data and call callback function with result
			let data = "";
			httpRequest.on("data", function(chunk) { data += chunk; });
			httpRequest.on("end", function() {
				try {
					// If no content is present answer undefined
					let parsedData = data.length > 0 ? JSON.parse(data) : undefined
					request.setData(parsedData);
					self._handle(request);
				} catch(e) {
					console.error("Failed to parse JSON data: ", e);
					request.writeResponse(Result.invalidData);
				}
			});
			httpRequest.on("error", function(error) {
				console.error("Failed to read HTTP request data: ", error);
				request.writeResponse(Result.internalError);
			});
		} else {

			// No data present
			self._handle(request);
		}
	}
	addEndpointsFromCollection(endpointsCollection) {
		const self = this;

		// Add the endpoint objects from the collection
		// The endpoint objects might be created from literal objects
		// and therefor need to be instantiated as 'real' instances.
		endpointsCollection.forEach(function(endpointObject) {

			// Make endpoint into instance
			let endpoint = null;
			if(endpointObject.getPath) {
				endpoint = endpointObject;
			} else if(endpointObject.path && endpointObject.operations) {
				endpoint = new Endpoint(endpointObject.path)
				endpointObject.operations.forEach(function(operationObject) {
					if(operationObject.method && operationObject.action) {
						let operation = new Operation(operationObject.method, operationObject.action, operationObject.authorization);
						endpoint.addOperation(operation);
					} else {
						throw new Error("Every API operation needs to have a method and action (and can optionally have an authorization)");
					}
				});
			} else {
				throw new Error("Every API endpoint needs to have a path and operations");
			}
			self.addEndpoint(endpoint);
		});
	}
	addEndpoint(endpoint) {
		const self = this;

		self._endpoints.push(endpoint);
	}
	getResources() {
		const self = this;

		return self._resources;
	}

	// Private instance methods
	_handle(request) {
		const self = this;

		// Execute action for first matching API endpoint
		let result = null;
		self._endpoints.some(function(endpoint) {
			let endpointResult = endpoint.handle(request);
			result = Result.mostSpecific(result, endpointResult);

			return result.isOk();
		});

		// If no result is found, set it appropriatly
		if(!result) {
			result = Result.noResourceFound;
		}

		request.writeResponse(result);
	}
}

module.exports = API;
