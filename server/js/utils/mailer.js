// Import classes and objects
let fs = require("fs");
let nodemailer = require("nodemailer");
let Validators = require("./validators");

// Globals
let authOptions = JSON.parse(fs.readFileSync("private/server/mail-auth.json"));
let transport = nodemailer.createTransport({
	host: "smtp.office365.com",
	port: 587,
	secure: false,
	auth: authOptions,
	tls: { ciphers: "SSLv3" }
});

// Class: Mailer for sending messages
class Mailer {
	static sendMessage(to, subject, message) {

		// Validate receivers
		if(Array.isArray(to)) {
			to.forEach(function(receiver) {
				if(!Validators.validateEmail(receiver)) {
					throw new Error("Failed to send mail: invalid mail receiver: " + receiver);
				}
			});

			// Concatenate receivers into single string
			to = to.join(",");
		} else {
			if(!Validators.validateEmail(to)) {
				throw new Error("Failed to send mail: invalid mail receiver: " + to);
			}
		}

		// Create mail message
		let mailMessage = {
			from: authOptions.user,
			to: to,
			subject: subject
		};
		if(message.text && message.html) {
			mailMessage.text = message.text;
			mailMessage.html = message.html;
		} else {
			mailMessage.text = message.toString();
		}

		// Send mail
		transport.sendMail(mailMessage, function(error) {
			if(error) {
				console.error("Failed to send mail: ", error);
			}
		});
	}
}

module.exports = Mailer;
