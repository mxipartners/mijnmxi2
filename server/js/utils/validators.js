// Constants
const VALID_ID_REGEX = new RegExp(
	"^" +		// Start of string (do not allow leading garbage)
	"[1-9]" +	// Start with non-zero digit
	"\\d*" +	// Zero or more digits
	"$"		// End of string (do not allow trailing garbage)
);
const VALID_EMAIL_REGEX = new RegExp(
	"^" +		// Start of string (do not allow leading garbage)
	"[^\\s@]+" +	// Name part: no whitespace or @ allowed (length >= 1)
	"@" +		// @
	"[^\\s@\\.]+" +	// Domain part: no whitespace or @ or . allowed (length >= 1)
	"\\." +		// Domain part: .
	"[^\\s@]+" +	// Domain part: no whitespace or @ (but . IS allowed) (length >= 1)
	"$"		// End of string (do not allow trailing garbage)
, "i");			// Ignore case
const VALID_URL_REGEX = new RegExp(
	"^" +		// Start of string (do not allow leading garbage)
	"(?:http|https)" +		// Explicit protocol
	"://" +				// Divider (protocol from domain name)
	"[a-z0-9][a-z0-9\\-]*" +	// First part of domain name (not allowed to start with dash)
	"(?:\\.[a-z0-9][a-z0-9\\-]*)*" +	// Additional domain name parts (optional)
	"\\.[a-z]+" +			// Top level domain name part (only alfabetical characters)
	"(?:/[^\\s]*)?" +		// Path (no whitespaces)
	"$"		// End of string (do not allow trailing garbage)
, "i");			// Ignore case

// Class: Validators validate values for storage and/or authorization
class Validators {

	constructor() {
		throw new Error("Generators only has class methods, do not instantiate");
	}

	// Public class methods
	static validateEmail(email, domain) {
		if(!email || !VALID_EMAIL_REGEX.test(email)) {
			return false;
		}

		// Check domain part if present (is case insensitive)
		if(domain) {
			if(!email.toLowerCase().endsWith("@" + domain.toLowerCase())) {
				return false;
			}
		}

		return true;
	}
	static validateUrl(url) {
		if(!url || !VALID_URL_REGEX.test(url)) {
			return false;
		}
		return true;
	}
	static validateParameters(parameters, description, logLevel) {
		const self = Validators;

		// Default log level (0 = write everything, 1 = write secure (no data), 2 = write nothing)
		if(!logLevel) {
			logLevel = 0;
		}

		// Validate presence of parameters
		if(!parameters) {
			if(logLevel <= 1) {
				console.error("Failed to validate: No parameters specified");
			}
			return false;
		}

		// Validate no unknown parameters are present
		let hasUnknownParams = Object.keys(parameters).some(function(name) {
			// Ignore internal parameters
			if(name.startsWith("_")) {
				return false;
			}

			// Validate regular parameter
			return description[name] === undefined;
		});
		if(hasUnknownParams) {
			if(logLevel === 1) {
				console.error("Failed to validate: Unknown parameters specified");
			} else if(logLevel === 0) {
				console.error("Failed to validate: Unknown parameters specified:", parameters, description);
			}
			return false;
		}

		// Validate all parameter types and values
		let allParamsValid = Object.keys(description).every(function(name) {
			let descriptorString = description[name];
			let descriptor;
			if(descriptorString.substr) {
				descriptor = descriptorString
					.replace(/^([^,]*):/, "$1,")	// Replace first : by , (for easy splitting)
					.split(",")
				;
			} else {
				descriptor = descriptorString;
			}
			if(Array.isArray(descriptor)) {

				// Descriptor is array of "type" and type parameters
				if(descriptor[0] === "id") {
					let id = parameters[name];
					return id && VALID_ID_REGEX.test(id);
				} else if(descriptor[0] === "idOrNull") {
					let id = parameters[name];
					return id === null || (id && VALID_ID_REGEX.test(id));
				} else if(descriptor[0] === "email") {
					return descriptor.length <= 2 && self.validateEmail(parameters[name], descriptor[1]);
				} else if(descriptor[0] === "string") {
					let value = parameters[name];
					if(value === null) {
						return descriptor.length === 1;	// If min/max lengths are specified, null is not allowed
					}
					if(value === undefined || !value.substr || descriptor.length > 4) {
						return false;
					}
					if(descriptor[3] === "trim") {
						value = value.trim();
					}
					if(descriptor[1] !== "") {
						let minLength = +descriptor[1];
						if(value.length < minLength) {
							return false;
						}
					}
					if(descriptor[2] !== "") {
						let maxLength = +descriptor[2];
						if(value.length > maxLength) {
							return false;
						}
					}
					return true;
				} else if(descriptor[0] === "number") {
					let value = parameters[name];
					if(value === null) {
						return descriptor.length === 1;	// If min/max value are specified, null is not allowed
					}
					if(value === undefined || !Number.isInteger(+value) || descriptor.length > 3) {
						return false;
					}
					value = +value;
					if(descriptor[1] !== "") {
						let minValue = +descriptor[1];
						if(value < minValue) {
							return false;
						}
					}
					if(descriptor[2] !== "") {
						let maxValue = +descriptor[2];
						if(value > maxValue) {
							return false;
						}
					}
					return true;
				} else if(descriptor[0] === "fixed") {
					if(descriptor.length === 2) {
						let values = descriptor[1].split("|");
						return values.indexOf(parameters[name]) >= 0;
					}
					return false;
				} else if(descriptor[0] === "url") {
					if(descriptor.length !== 1) {
						return false;
					}
					return self.validateEmpty(parameters[name]);
				}
			} else if(descriptor.test) {

				// Descriptor is regular expression (or other testing function)
				return descriptor.test(parameters[name]);
			}
			if(logLevel === 1) {
				throw new Error("Failed to validate: Unknown parameter description");
			} else if(logLevel === 0) {
				throw new Error("Failed to validate: Unknown parameter description: " + descriptorString);
			}
		});
		if(!allParamsValid) {
			if(logLevel === 1) {
				console.error("Failed to validate: Invalid parameters");
			} else if(logLevel === 0) {
				console.error("Failed to validate: Invalid parameters:", parameters, description);
			}
			return false;
		}

		return true;
	}
	static validateEmpty(parameters) {
		const self = this;

		return self.validateParameters(parameters, {});
	}
}

module.exports = Validators;
