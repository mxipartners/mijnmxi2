// Class: Request defines an API request
class Request {

	constructor(httpRequest, responseWriter, resources) {
		const self = this;

		self._httpRequest = httpRequest;
		self._parameters = {};
		self._data = {};
		self._resources = resources;
		self._responseWriter = responseWriter;
	}

	// Public instance methods
	writeResponse(result) {
		const self = this;

		// Send response
		if(result.isOkWithData()) {
			self._responseWriter.writeHead(result.getCode(), { "Content-Type": "application/json" });
			self._responseWriter.end(JSON.stringify(result.getData()));
		} else {
			self._responseWriter.writeHead(result.getCode());
			self._responseWriter.end(result.getMessage());
		}
	}
	getMethod() {
		const self = this;

		return self._httpRequest.method;
	}
	getPath() {
		const self = this;

		return self._httpRequest.url;
	}
	getHeader(name) {
		const self = this;

		return self._httpRequest.headers[name];
	}
	getParameters() {
		const self = this;

		// Answer a copy of the parameters (to prevent changing its value,
		// which has to be done explicitly through a call to addParameter())
		// Parameters are a combination of path parameters and data (the former
		// having precedence over the later).
		return Object.assign({}, self._data, self._parameters);
	}
	getParameter(name) {
		const self = this;

		let value = self._data[name];
		if(value === undefined) {
			value = self._parameters[name];
		}
		return value;
	}
	setParameters(parameters) {
		const self = this;

		// Replace all parameters
		self._parameters = {};
		Object.assign(self._parameters, parameters);
	}
	addParameter(name, value) {
		const self = this;

		// Add single parameter to existing parameters
		self._parameters[name] = value;
	}
	removeParameters(/* param1, param2, paramX, ... */) {
		const self = this;

		// arguments does not have Array-like properties use old-fashioned for-loop
		for(let i = 0; i < arguments.length; i++) {
			self.removeParameter(arguments[i]);
		}
	}
	removeParameter(paramName) {
		const self = this;

		// Remove parameter from both path parameters and data
		delete self._parameters[paramName];
		delete self._data[paramName];
	}
	setData(data) {
		const self = this;

		self._data = data || {};
	}
	getResource(name) {
		const self = this;

		return self._resources[name];
	}
	addResources(resources) {
		const self = this;

		Object.assign(self._resources, resources);
	}
	addResource(name, value) {
		const self = this;

		self._resources[name] = value;
	}
	getHttpRequest() {
		const self = this;

		return self._httpRequest;
	}
}

module.exports = Request;
