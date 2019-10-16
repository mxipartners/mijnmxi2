// Constants
const PORT = 8080;

// Globals
const https = require("https");
const http = require("http");
const fs = require("fs");
const apiServer = require("./api-server");
//const Uploader = require("./utils/uploader");

// Content types for responses
const contentTypes = {
	html: "text/html",
	css: "text/css",
	js: "text/javascript",
	gif: "image/gif",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml"
};
const defaultContentType = "application/octet-stream";

// Create web server (using SSL)
var webServer = null;
if(process.env.NODE_ENV !== "production") {

	var webServerOptions = {
		key: fs.readFileSync("private/server/key.pem"),
		cert: fs.readFileSync("private/server/cert.pem"),
		passphrase: "GeenGeheimHier"
	};
	webServer = https.createServer(webServerOptions, function(request, response) {

		// Forward API requests (for development only!)
		var url = request.url;
		if(url.startsWith("/api/")) {
			forwardAPIRequest(request, response);
			return;
		}

		// Handle request
		var urlWithoutParameters = url.replace(/[?#].*/, "");
		if(urlWithoutParameters === "/admin/uploads/process") {
			// Handle upload file
			Uploader.process(request, response);
		} else if(urlWithoutParameters === "/admin/uploads/revert") {
			// Handle upload file
			Uploader.revert(request, response);
		} else {
			// Handle regular request
			var path;
			if(urlWithoutParameters.startsWith("/admin/uploads/")) {
				path = urlWithoutParameters.replace(/^\/admin\//, "./").replace(/\.\./g, "");
			} else {
				path = "client" + urlWithoutParameters;
			}
			fs.readFile(path, function(error, data) {
				if(error) {
					console.error("Error on web-request", error, urlWithoutParameters);
					response.writeHead(404);
					response.end("Resource not found");
				} else {
					var extension = urlWithoutParameters.replace(/^.*\.([^.]+)$/, "$1");
					var contentType = contentTypes[extension];
					if(!contentType) {
						contentType = defaultContentType;
					}
					response.setHeader("Content-Type", contentType);
					response.end(data);
				}
			});
		}
	});

	// Forward provided request to API end point (ie through data server)
	var forwardAPIRequest = function(request, response) {

		// Copy request options to forward request to API endpoint
		var requestOptions = {
			protocol: "http:",	// no SSL needed
			hostname: "localhost",
			port: apiServer.address().port,
			method: request.method,
			path: request.url,
			headers: request.headers
		};

		// Create API request object
		var apiRequest = http.request(requestOptions, function(apiResponse) {

			// Retrieve API response
			apiResponse.setEncoding("utf-8");
			var responseData = "";
			apiResponse.on("data", function(chunk) { responseData += chunk; });
			apiResponse.on("end", function() {
				response.writeHead(apiResponse.statusCode, { "Content-Type": "application/json" });
				response.end(responseData);
			});
			apiResponse.on("error", function(error) {
				console.error("Internal Error. Failed to read API response.", error);
				response.writeHead(500);
				response.end("Internal error");
			});
		});
		apiRequest.on("error", function(error) {
			console.error("Internal Error. Failed to handle/forward API request.", error);
			response.writeHead(500);
			response.end("Internal error");
		});

		// Copy request data to API request
		var requestData = "";
		request.on("data", function(chunk) { requestData += chunk; });
		request.on("end", function() {
			apiRequest.write(requestData);
			apiRequest.end();
		});
		request.on("error", function(error) {
			console.error("Internal Error. Failed to read request data during forwarding to API.", error);
			response.writeHead(500);
			response.end("Internal error");
		});
	};

	// Start listening on provided port
	webServer.listen(PORT, function(error) {
		if(error) {
			console.error("Error in web-server: ", error);
		} else {
			console.log("A web-server is listening on port " + PORT);
		}
	});
}

// Export web server
module.exports = webServer;
