// Constants
const VALID_EMAIL_REGEX = new RegExp(
	"^" +		// Start of string (do not allow leading garbage)
	"[^\\s@]+" +	// Name part: no whitespace or @ allowed (length >= 1)
	"@" +		// @
	"[^\\s@\\.]+" +	// Domain part: no whitespace or @ or . allowed (length >= 1)
	"\\." +		// Domain part: .
	"[^\\s@]+" +	// Domain part: no whitespace or @ (but . IS allowed) (length >= 1)
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
	static validateParameters(parameters, description) {
		const self = Validators;

		// Validate presence of parameters
		if(!parameters) {
			console.error("Failed to validate: No parameters specified");
			return false;
		}

		// Validate no unknown parameters are present
		var hasUnknownParams = Object.keys(parameters).some(function(name) {
			return description[name] === undefined;
		});
		if(hasUnknownParams) {
			console.error("Failed to validate: Unknown parameters specified:", parameters, description);
			return false;
		}

		// Validate all parameter types and values
		var allParamsValid = Object.keys(description).every(function(name) {
			var descriptorString = description[name];
			var descriptor;
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
					return Number.isInteger(+parameters[name]);
				} else if(descriptor[0] === "email") {
					return descriptor.length <= 2 && self.validateEmail(parameters[name], descriptor[1]);
				} else if(descriptor[0] === "string") {
					var value = parameters[name];
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
						var minLength = +descriptor[1];
						if(value.length < minLength) {
							return false;
						}
					}
					if(descriptor[2] !== "") {
						var maxLength = +descriptor[2];
						if(value.length > maxLength) {
							return false;
						}
					}
					return true;
				} else if(descriptor[0] === "number") {
					var value = parameters[name];
					if(value === null) {
						return descriptor.length === 1;	// If min/max value are specified, null is not allowed
					}
					if(value === undefined || !Number.isInteger(value) || descriptor.length >= 3) {
						return false;
					}
					if(descriptor[1] !== "") {
						var minValue = +descriptor[1];
						if(value < minValue) {
							return false;
						}
					}
					if(descriptor[2] !== "") {
						var maxValue = +descriptor[2];
						if(value > maxValue) {
							return false;
						}
					}
					return true;
				} else if(descriptor[0] === "fixed") {
					return descriptor.length === 2 && parameters[name] === descriptor[1];
				}
			} else if(descriptor.test) {

				// Descriptor is regular expression (or other testing function)
				return descriptor.test(parameters[name]);
			}
			throw new Error("Failed to validate: Unknown parameter description: " + descriptorString);
		});
		if(!allParamsValid) {
			console.error("Failed to validate: Invalid parameters:", parameters, description);
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
