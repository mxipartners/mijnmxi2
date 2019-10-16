// Constants
const FILENAME_TOKEN_LENGTH = 32;
const FILENAME_PREFIX = "./uploads/";
const VALID_FILENAME_REGEX = /^\.\/uploads\/image_[0-9a-f]+\.[^\.]*$/;

//var IncomingForm = require("formidable").IncomingForm;
var fs = require("fs");
var Busboy = require("busboy");
var Generators = require("./generators");


// Class: Uploader of files
class Uploader {
	static process(httpRequest, responseWriter) {

		// Check valid method
		if(httpRequest.method !== "POST") {
			responseWriter.writeHead(405);
			responseWriter.end("Method not allowed");
			return;
		}

		var filePaths = [];

		var busboy = new Busboy({
			headers: httpRequest.headers,
			limits: {
				fileSize: 5 * 1024 * 1024,
				files: 5
			}
		});

		busboy.on("file", function(fieldName, file, fileName, encoding, mimeType) {
			var fileExtension = ".jpg";	// Fake default value that most browser will hopefully forgive
			var extensionIndex = fileName.lastIndexOf(".");
			if(extensionIndex >= 0) {
				fileExtension =  fileName.slice(extensionIndex);
			}
			var filePath = FILENAME_PREFIX + "image_" + Generators.generateToken(FILENAME_TOKEN_LENGTH) + fileExtension;
			filePaths.push(filePath);
			file.pipe(fs.createWriteStream(filePath));
		});

		busboy.on("finish", function() {
			responseWriter.writeHead(200, { "Content-Type": "application/json" });
			responseWriter.end(JSON.stringify({ filePaths: filePaths }));
		});

		return httpRequest.pipe(busboy);
	}

	static revert(httpRequest, responseWriter) {

		// Check valid method
		if(httpRequest.method !== "DELETE") {
			responseWriter.writeHead(405, { "Content-Type": "text/plain" });
			responseWriter.end("Method not allowed");
			return;
		}

		// Check valid content
		var imagePath = httpRequest.headers["x-file-path"];
		if(!imagePath || !VALID_FILENAME_REGEX.test(imagePath)) {
			responseWriter.writeHead(400, { "Content-Type": "text/plain" });
			responseWriter.end("Bad request");
			return;
		}

		fs.unlink(imagePath, function(error) {
			if(error) {
				console.error("File named " + imagePath + " could not be deleted");
			}
		});
		responseWriter.writeHead(200, { "Content-Type": "text/plain" });
		responseWriter.end("");
	}
}

module.exports = Uploader;
