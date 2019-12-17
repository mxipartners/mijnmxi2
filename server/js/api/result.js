// Constants
const CODE_OK = 200;
const CODE_OK_WITH_DATA = 204;

// Class: Result defines API results
class Result {

	constructor(code, message, specificity) {
		const self = this;

		self._code = code;
		self._message = message;
		self._data = undefined;
		self._specificity = specificity;
	}

	// Public class methods (constructors)
	static fromData(data) {
		let result = new Result(CODE_OK, null, 100);
		result._data = data;
		return result;
	}
	static fromSQLException(exception, defaultResult) {
		if(exception.code) {
			let sqlExceptionToResultCode = {
				SQLITE_CONSTRAINT_UNIQUE: Result.constraintViolation,
				SQLITE_CONSTRAINT_NOTNULL: Result.constraintViolation,
				SQLITE_CONSTRAINT_FOREIGNKEY: Result.constraintViolation
			};
			return sqlExceptionToResultCode[exception.code] || Result.internalError;
		}
		return defaultResult;
	}

	// Public instance methods
	getCode() {
		const self = this;

		return self._code;
	}
	getMessage() {
		const self = this;

		return self._message;
	}
	getData() {
		const self = this;

		return self._data;
	}
	addData(additionalData) {
		const self = this;

		Object.assign(self._data, additionalData);
	}
	isOk() {
		const self = this;

		return self._code === CODE_OK || self._code === CODE_OK_WITH_DATA;
	}
	hasData() {
		const self = this;

		return self._data !== undefined;
	}
	isOkWithData() {
		const self = this;

		return self.isOk() && self.hasData();
	}

	// Public class methods
	static isInstance(resultOrNot) {
		// Answer whether resultOrNot has same functionality as a Result instance
		// (ie duck-typing: if it walks and quacks like a duck it must be a duck).
		// It does NOT check whether the result is actually "isOkWithData", merely
		// whether this method is present (ie if the receiver can answer that).
		return resultOrNot && resultOrNot.getCode && resultOrNot.isOkWithData;
	}
	static mostSpecific(result, otherResult) {
		if(!result) {
			return otherResult;
		} else if(!otherResult) {
			return result;
		}
		// Test for OK (gives priority on specificity)
		if(result._specificity === otherResult._specificity) {
			if(otherResult.isOk() && !result.isOk()) {
				return otherResult;
			} else {
				return result;
			}
		}
		return result._specificity > otherResult._specificity ? result : otherResult;
	}
}

// Assign default result instances
// Errors (like invalid data, constraint violation and internal error) have highest
// specificity and should not be dismissed.
// When method not allowed is encountered, another operation might still be available
// with the correct method. Likewise for resource not found, another endpoint might be
// available matching the requested resource.
// An unauthorized result is more specific than method not allowed, since it does
// mean a matching endpoint and operation is found (but authorization failed). Only a
// valid combination and authorization will be more specific (or an error occurring).
Object.assign(Result, {
	ok: new Result(CODE_OK, "OK", 100),
	okNoData: new Result(CODE_OK_WITH_DATA, "OK", 100),
	invalidData: new Result(400, "Bad request", 100),
	constraintViolation: new Result(409, "Conflict", 100),
	noLongerAvailable: new Result(410, "Gone", 100),
	internalError: new Result(500, "Internal error", 100),
	unauthorized: new Result(401, "Unauthorized", 50),
	methodNotAllowed: new Result(405, "Method not allowed", 30),
	noResourceFound: new Result(404, "Resource not found", 25)
});

module.exports = Result;
