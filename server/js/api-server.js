// Constants
const PORT = process.env.API_PORT || 8001;

// Import classes and methods
const createMxIAPI = require("./mxi-api");
const dataStore = require("./mxi-data-store");		// Resource for API
const Mailer = require("./utils/mailer");		// Resource for API
const Validators = require("./utils/validators");	// Resource for API
const Generators = require("./utils/generators");	// Resource for API
const http = require("http");

const api = createMxIAPI({
	dataStore: dataStore,
	mailer: Mailer,
	validators: Validators,
	generators: Generators
});

// Create API server
const apiServer = http.createServer(function(request, responseWriter) {

	// Handle request, catching errors in handling
	try {
		api.handle(request, responseWriter);
	} catch(e) {

		// Log error and respond with internal error
		console.error("Internal Error. Failed to handle API request: ", e);
		responseWriter.writeHead(500);
		responseWriter.end("Internal Error");
	}
});

// Start listening on provided port
apiServer.listen(PORT, function(error) {
	if(error) {
		console.error("Error in api-server: ", error);
	} else {
		console.log("An api-server is listening on port " + PORT);
	}
});

module.exports = apiServer;
