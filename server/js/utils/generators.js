// Constants
var BCRYPT_HASH_SALT_ROUNDS = 10;

// Import classes and objects
var crypto = require("crypto");
var bcrypt = require("bcrypt");

// Class: Generators create tokens and hashes
class Generators {

	constructor() {
		throw new Error("Generators only has class methods, do not instantiate");
	}

	// Token functions
	static generateToken(length) {
		return crypto.randomBytes(length).toString("hex");
	}

	// Password functions
	static generatePasswordHash(password) {
		return bcrypt.hashSync(password, BCRYPT_HASH_SALT_ROUNDS);
	}
	static comparePasswordAndHash(password, hash) {
		return bcrypt.compareSync(password, hash);
	}

	// Expiration timestamps
	static generateExpirationDays(days) {
		const self = Generators;

		return self.generateExpirationHours(days * 24);
	}
	static generateExpirationHours(hours) {
		const self = Generators;

		return self.generateExpirationMinutes(hours * 60);
	}
	static generateExpirationMinutes(minutes) {
		const self = Generators;

		return self.generateExpirationSeconds(minutes * 60);
	}
	static generateExpirationSeconds(seconds) {
		const self = Generators;

		return Date.now() + seconds * 1000;	// Milliseconds
	}
}

module.exports = Generators;
