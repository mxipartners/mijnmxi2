// Constants
var PORT = 8080;

// Globals
var https = require("https");
var http = require("http");
var fs = require("fs");
var path = require("path");
var dataServer = require("./data-server");

// Content types for responses
var contentTypes = {
	html: "text/html",
	css: "text/css",
	js: "text/javascript",
	gif: "image/gif",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml"
};
var defaultContentType = "application/octet-stream";

// Create web server (using SSL)
var webServerOptions = {
	key: fs.readFileSync(path.join(__dirname, "..", "..", "private", "cert", "server", "privkey.pem")),
	cert: fs.readFileSync(path.join(__dirname, "..", "..", "private", "cert", "server", "fullchain.pem"))
};
var webServer = https.createServer(webServerOptions, function(request, response) {

	// Forward API requests (for development only!)
	var url = request.url;
	if(url.startsWith("/api/")) {
		forwardAPIRequest(request, response);
		return;
	}

	// Handle regular request
	fs.readFile("client" + request.url, function(error, data) {
		if(error) {
			console.error("Error on web-request", error, url);
			response.writeHead(404);
			response.end("Resource not found");
		} else {
			var extension = url.replace(/^.*\.([^.]+)$/, "$1");
			var contentType = contentTypes[extension];
			if(!contentType) {
				contentType = defaultContentType;
			}
			response.setHeader("Content-Type", contentType);
			response.end(data);
		}
	});
});

// Forward provided request to API end point (ie through data server)
function forwardAPIRequest(request, response) {

	// Copy request options to forward request to API endpoint
	var requestOptions = {
		protocol: "http:",	// no SSL needed
		hostname: "localhost",
		port: dataServer.address().port,
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
}

// Start listening on provided port
webServer.listen(PORT, function(error) {
	if(error) {
		console.error("Error in web-server", error);
	} else {
		console.log("web-server is listening on port " + PORT);
	}
});

// Export web server
module.exports = webServer;
