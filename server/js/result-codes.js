// Globals
var resultCodes = {
	noResourceFound: { code: 404, message: "Resource not found" },
	invalidData: { code: 400, message: "Bad request" },
	uniqueConstraintViolation: { code: 409, message: "Conflict" }
};

// Export result codes
module.exports = resultCodes;
