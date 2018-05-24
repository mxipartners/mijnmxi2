// Globals
var resultCodes = {
	noResourceFound: { code: 200, message: "No resource found" },
	invalidData: { code: 400, message: "Bad request" },
	uniqueConstraintViolation: { code: 409, message: "Conflict" }
};

// Export result codes
module.exports = resultCodes;
