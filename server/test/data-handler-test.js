var tape = require("tape");
var dataHandler = require("../js/data-handler");

// Fake Response object
function Response() {

	// Attributes
	this.resultCode = 200;
	this.headers = {};
	this.data = "";

	// Methods
	this.writeHead = function(resultCode, headers) {
		this.resultCode = resultCode;
		if(headers) {
			Object.assign(this.headers, headers);
		}
	};
	this.end = function(data) {
		this.data = data;
	}
}

tape("data-handler generic", function(test) {
	var response = new Response();
	dataHandler({ url: "/" }, response);
	test.equal(response.resultCode, 404, "Resource not found for default path");
	test.end();
});

tape("data-handler projects", function(test) {
	//var response = new Response();
	//dataHandler({ url: "/api/projects" }, response);
	//test.equal(response.resultCode, 200, "Projects found");
	//var data = JSON.parse(response.data);
	//test.equal(data.length, 3, "3 projects found");
	test.end();
});
