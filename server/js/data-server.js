// Constants
var PORT = 8001;

// Globals
var http = require("http");
var dataHandler = require("./data-handler");

// Start data server
var dataServer = http.createServer(function(request, response) {

	// Handle request, catching errors in handling
	try {
		dataHandler(request, response);
	} catch(error) {

		// Log error and respond with internal error
		console.error(error);
		response.writeHead(500);
		response.end("Internal Error");
	}
});

dataServer.listen(PORT, function(error) {
	if(error) {
		console.error("Error in data-server", error);
	} else {
		console.log("data-server is listening on port " + PORT);
	}
});
