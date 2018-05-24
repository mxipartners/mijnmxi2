// Constants
var ACTIVATION_TOKEN_LENGTH = 32;		// bytes
var ACTIVATION_EXPIRATION_TIMEOUT = 3600000;	// 1 hour in milliseconds
var BCRYPT_HASH_SALT_ROUNDS = 10;

// Globals
var crypto = require("crypto");
var bcrypt = require("bcrypt");
var mailer = require("./mailer");

// Users functions
var users = {

	// Validation functions
	validateEmail: function(email) {
		if(!email || !/^[^\s@]+@mxi.nl$/.test(email)) {
			return false;
		}
		return true;
	},
	validatePassword: function(password) {
		if(!password || password.length < 3) {
			return false;
		}
		return true;
	},

	// Password functions
	generatePasswordHash: function(password) {
		return bcrypt.hashSync(password, BCRYPT_HASH_SALT_ROUNDS);
	},
	comparePasswordHash: function(password, hash) {
		return bcrypt.compareSync(password, hash);
	},

	// Activation functions
	generateActivationToken: function() {
		return crypto.randomBytes(ACTIVATION_TOKEN_LENGTH).toString("hex");
	},
	generateActivationExpiration: function() {
		return Date.now() + ACTIVATION_EXPIRATION_TIMEOUT;
	},
	sendActivationToken: function(to, activationToken) {
		return mailer.sendMail(to, "Uw activationtoken: " + activationToken);
	}
};

// Export users
module.exports = users;
