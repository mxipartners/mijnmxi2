// Globals
var fs = require("fs");
var nodemailer = require("nodemailer");
var authOptions = JSON.parse(fs.readFileSync("server/mail-auth.json"));
var transport = nodemailer.createTransport({
	host: "smtp.office365.com",
	port: 587,
	secure: false,
	auth: authOptions,
	tls: { ciphers: "SSLv3" }
});

// Mailer functions
var mailer = {
	sendMail: function(to, message) {
		transport.sendMail({
			from: authOptions.user,
			to: to,
			text: message
		}, function(error, data) {
			console.log(error, data);
		});
	}
};

// Export users
module.exports = mailer;
