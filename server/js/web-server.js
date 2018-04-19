// Constants
var PORT = 8080;

// Globals
var http = require("http");
var fs = require("fs");

// Start web server
var webServer = http.createServer(function(request, response) {

	// Redirect api requests (for development only!)
	if(request.url.startsWith("/api/")) {
		http.get("http://localhost:8001" + request.url, function(apiResponse) {
			apiResponse.setEncoding("utf-8");
			var responseData = "";
			apiResponse.on("data", function(chunk) { responseData += chunk; });
			apiResponse.on("end", function() {
				response.writeHead(apiResponse.statusCode, { "Content-Type": "application/json" });
				response.end(responseData);
			});
		});
		return;
	}

	// Handle regular request
	fs.readFile("client" + request.url, function(error, data) {
		if(error) {
			console.error("Error on web-request", error, request.url);
			response.writeHead(404);
			response.end("File not found");
		} else {
			response.end(data);
		}
	});
});

webServer.listen(PORT, function(error) {
	if(error) {
		console.error("Error in web-server", error);
	} else {
		console.log("web-server is listening on port " + PORT);
	}
});
