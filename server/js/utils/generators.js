// Constants
let BCRYPT_HASH_SALT_ROUNDS = 10;

// Import classes and objects
let crypto = require("crypto");
let bcrypt = require("bcrypt");

// Class: Generators create tokens and hashes
class Generators {

	constructor() {
		throw new Error("Generators only has class methods, do not instantiate");
	}

	// Token functions
	static generateToken(length) {
		return crypto.randomBytes(length).toString("hex");
	}

	// Random number functions
	static generateRandomNumber(lower, upper) {
		let spread = upper - lower;
		if(spread < 0) {
			throw new Error("generateRandomNumber received inconsistent arguments");
		}
		let random = crypto.randomBytes(4).readUInt32BE(0);
		let index = random % (spread + 1);
		return lower + index;
	}

	// Password functions
	static generatePasswordHash(password) {
		return bcrypt.hashSync(password, BCRYPT_HASH_SALT_ROUNDS);
	}
	static comparePasswordHash(password, hash) {
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
