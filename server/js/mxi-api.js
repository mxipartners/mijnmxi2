// Constants
const APP_LINK = process.env.APP_LINK || "https://localhost:8080/index.html";
const HTTP_GET = "GET";
const HTTP_POST = "POST";
const HTTP_PUT = "PUT";
const HTTP_PATCH = "PATCH";
const HTTP_DELETE = "DELETE";
const MINIMAL_PASSWORD_LENGTH = 6;
const ACTIVATION_TOKEN_LENGTH = 64;
const ACTIVATION_EXPIRATION_HOURS = 1;
const ACTIVATION_MAIL_TEXT =
	"Bedankt voor het inschrijven bij mijn.mxi.nl. Via onderstaande link wordt " +
	"je account geactiveerd. Deze link is " + ACTIVATION_EXPIRATION_HOURS + " uur houdbaar dus activeer tijdig.\n" +
	"\n" +
	"{link}\n" +
	"\n" +
	"Deze mail is verzonden vanaf een emailadres waar geen gebruiker aan gekoppeld is. " +
	"Antwoorden op deze mail worden daardoor niet gelezen. Neem telefonisch contact op " +
	"met de beheerder voor vragen en opmerkingen."
;
const ACTIVATION_MAIL_HTML =
	"<h1>mijn.mxi.nl</h1>" +
	"<p>" +
	"Bedankt voor het inschrijven bij mijn.mxi.nl. Via onderstaande link wordt " +
	"je account geactiveerd. Deze link is " + ACTIVATION_EXPIRATION_HOURS + " uur houdbaar dus activeer tijdig." +
	"</p>" +
	"<p><a href=\"{link}\">Activatielink</a></p>" +
	"<p>" +
	"Deze mail is verzonden vanaf een emailadres waar geen gebruiker aan gekoppeld is. " +
	"Antwoorden op deze mail worden daardoor niet gelezen. Neem telefonisch contact op " +
	"met de beheerder voor vragen en opmerkingen." +
	"</p>"
;
const PASSWORD_RESET_TOKEN_LENGTH = 64;
const PASSWORD_RESET_EXPIRATION_HOURS = 1;
const PASSWORD_RESET_MAIL_TEXT =
	"Er is een wachtwoordherstelverzoek ingediend bij mijn.mxi.nl. Via onderstaande link kan " +
	"een nieuw wachtwoord worden ingesteld. Als het verzoek niet door jou is verzonden, negeer " +
	"deze mail dan (meld dit ajb wel bij herhaald voorkomen).\n" +
	"\n" +
	"{link}\n" +
	"\n" +
	"Deze mail is verzonden vanaf een emailadres waar geen gebruiker aan gekoppeld is. " +
	"Antwoorden op deze mail worden daardoor niet gelezen. Neem telefonisch contact op " +
	"met de beheerder voor vragen en opmerkingen."
;
const PASSWORD_RESET_MAIL_HTML =
	"<h1>mijn.mxi.nl</h1>" +
	"<p>" +
	"Er is een wachtwoordherstelverzoek ingediend bij mijn.mxi.nl. Via onderstaande link kan " +
	"een nieuw wachtwoord worden ingesteld. Als het verzoek niet door jou is verzonden, negeer " +
	"deze mail dan (meld dit ajb wel bij herhaald voorkomen)." +
	"</p>" +
	"<p><a href=\"{link}\">Wachtwoordherstellink</a></p>" +
	"<p>" +
	"Deze mail is verzonden vanaf een emailadres waar geen gebruiker aan gekoppeld is. " +
	"Antwoorden op deze mail worden daardoor niet gelezen. Neem telefonisch contact op " +
	"met de beheerder voor vragen en opmerkingen." +
	"</p>"
;
const SESSION_TOKEN_LENGTH = 64;
const SESSION_TOKEN_EXPIRATION_HOURS = 8;

// Import classes
const API = require("./api/api");
const Result = require("./api/result");

// Helper methods for authorization
function hasSession(request) {

	// Retrieve session token from request
	var sessionToken = request.getHeader("x-session-token");
	if(!sessionToken) {
		return false;
	}

	// Retrieve user for the specified session token
	var user = request.getResource("dataStore").privateGetUser({
		token: sessionToken
	});

	// Process result
	if(user.isOk()) {
		request.addResource("user", user.getData());
	}
	return user;
}

const createMxIAPI = function(resources) {
	return new API(

// API endpoints with operations
[{
	path: "/api/users",
	operations: [
		{
			method: HTTP_POST,
			authorization: true,	// Allow all
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					email: "email:mxi.nl",
					password: "string:" + MINIMAL_PASSWORD_LENGTH
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Replace password by password hash
				var generators = request.getResource("generators");
				var passwordHash = generators.generatePasswordHash(request.getParameter("password"));
				request.addParameter("passwordHash", passwordHash);
				request.removeParameter("password");	// Never store password!

				// Add activation token and expiration
				var activationToken = generators.generateToken(ACTIVATION_TOKEN_LENGTH);
				var activationExpiration = generators.generateExpirationHours(ACTIVATION_EXPIRATION_HOURS);
				request.addParameter("activationToken", activationToken);
				request.addParameter("activationExpiration", activationExpiration);

				// Add user and send activation mail (on success)
				var result = request.getResource("dataStore").addUser(request.getParameters());
				if(result.isOk()) {
					var mailer = request.getResource("mailer");
					var link = APP_LINK + "?activationToken=" + activationToken;
					var mailMessage = {
						text: ACTIVATION_MAIL_TEXT.replace(/{link}/g, link),
						html: ACTIVATION_MAIL_HTML.replace(/{link}/g, link)
					};
					mailer.sendMessage(request.getParameter("email"), "Activatielink voor mijn.mxi.nl", mailMessage);
				}

				return result;
			}
		},
		{
			method: HTTP_PATCH,
			authorization: true,	// Allow all
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation;

				// Validate and perform activation
				validation = validators.validateParameters(request.getParameters(), {
					operation: "fixed:activate",
					activationToken: "string:" + (ACTIVATION_TOKEN_LENGTH * 2) + "," + (ACTIVATION_TOKEN_LENGTH * 2)
				});
				if(validation) {
					request.removeParameter("operation");

					// Add current timestamp
					request.addParameter("now", Date.now());

					// Perform update
					return request.getResource("dataStore").activateUser(request.getParameters());
				}

				// Validate and perform password forgotten
				validation = validators.validateParameters(request.getParameters(), {
					operation: "fixed:sendPasswordResetMail",
					email: "email"
				});
				if(validation) {
					request.removeParameter("operation");

					// Add password reset token and expiration
					var generators = request.getResource("generators");
					var passwordResetToken = generators.generateToken(PASSWORD_RESET_TOKEN_LENGTH);
					var passwordResetExpiration = generators.generateExpirationHours(PASSWORD_RESET_EXPIRATION_HOURS);
					request.addParameter("passwordResetToken", passwordResetToken);
					request.addParameter("passwordResetExpiration", passwordResetExpiration);

					// Perform update
					var result = request.getResource("dataStore").setPasswordResetForUser(request.getParameters());
					if(result.isOk()) {

						// Send password reset mail
						var mailer = request.getResource("mailer");
						var link = APP_LINK + "?passwordResetToken=" + passwordResetToken;
						var mailMessage = {
							text: PASSWORD_RESET_MAIL_TEXT.replace(/{link}/g, link),
							html: PASSWORD_RESET_MAIL_HTML.replace(/{link}/g, link)
						};
						mailer.sendMessage(request.getParameter("email"), "Wachtwoordherstellink voor mijn.mxi.nl", mailMessage);
					}
					return result;
				}

				// Validate and perform password reset
				validation = validators.validateParameters(request.getParameters(), {
					operation: "fixed:resetPassword",
					passwordResetToken: "string:" + (PASSWORD_RESET_TOKEN_LENGTH * 2) + "," + (PASSWORD_RESET_TOKEN_LENGTH * 2),
					password: "string:" + MINIMAL_PASSWORD_LENGTH
					
				});
				if(validation) {
					request.removeParameter("operation");

					// Replace password by password hash
					var generators = request.getResource("generators");
					var passwordHash = generators.generatePasswordHash(request.getParameter("password"));
					request.addParameter("passwordHash", passwordHash);
					request.removeParameter("password");	// Never store password!

					// Add current timestamp
					request.addParameter("now", Date.now());

					// Perform update
					return request.getResource("dataStore").resetPassword(request.getParameters());
				}

				return Result.invalidData;
			}
		}
	]
},
{
	path: "/api/users/:id",
	operations: [
		{
			method: HTTP_GET,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					id: "id"
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Retrieve all projects
				return request.getResource("dataStore").getUser(request.getParameters());
			}
		}
	]
},
{
	path: "/api/sessions",
	operations: [
		{
			method: HTTP_POST,
			authorization: true,	// Allow all
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					email: "email",
					password: "string:" + MINIMAL_PASSWORD_LENGTH
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Keep password in temporary var and remove from request data
				var password = request.getParameter("password");
				request.removeParameter("password");	// Never store password!

				// Retrieve user's password hash
				var result = request.getResource("dataStore").privateGetPasswordHash(request.getParameters());
				if(!result.isOk()) {
					return Result.invalidData;
				}

				// Compare password hashes
				var data = result.getData();
				var generators = request.getResource("generators");
				if(!generators.comparePasswordHash(password, data.passwordHash)) {
					return Result.invalidData;	// Do not answer unauthorized because it would reveal to much info!
				}

				// Create session with user id, token and expiration and replace all parameters
				var session = {
					userId: data.id,
					token: generators.generateToken(SESSION_TOKEN_LENGTH),
					expiration: generators.generateExpirationHours(SESSION_TOKEN_EXPIRATION_HOURS)
				};
				request.setParameters(session);
				request.setData({});

				// Store session
				var result = request.getResource("dataStore").addSession(request.getParameters());
				if(result.isOk()) {
					result.addData({ token: session.token, userId: session.userId });
				}

				return result;
			},
		},
		{
			// This is the garbage collector of expired sessions, everyone can call this
			method: HTTP_DELETE,
			authorization: true,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateEmpty(request.getParameters());
				if(!validation) {
					return Result.invalidData;
				}

				// Delete all expired sessions
				return request.getResource("dataStore").deleteSessions(request.getParameters());
			}
		}
	]
},
{
	path: "/api/sessions/:token",
	operations: [
		{
			method: HTTP_DELETE,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					token: "string:" + (SESSION_TOKEN_LENGTH * 2) + "," + (SESSION_TOKEN_LENGTH * 2)
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Delete user session
				return request.getResource("dataStore").deleteSession(request.getParameters());
			}
		}
	]
},
{
	path: "/api/projects",
	operations: [
		{
			method: HTTP_GET,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateEmpty(request.getParameters());
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Retrieve all projects
				return request.getResource("dataStore").getAllProjects(request.getParameters());
			}
		},
		{
			method: HTTP_POST,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					name: "string:1"
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Retrieve all projects
				return request.getResource("dataStore").addProject(request.getParameters());
			}
		}
	]
},
{
	path: "/api/projects/:id",
	operations: [
		{
			method: HTTP_GET,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					id: "id"
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Retrieve all projects
				return request.getResource("dataStore").getProject(request.getParameters());
			}
		},
		{
			method: HTTP_PUT,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					id: "id",
					name: "string:1",
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Update project
				return request.getResource("dataStore").updateProject(request.getParameters());
			}
		},
		{
			method: HTTP_DELETE,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					id: "id"
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Delete project
				return request.getResource("dataStore").deleteProject(request.getParameters());
			}
		}
	]
},
{
	path: "/api/projects/:id/members",
	operations: [
		{
			method: HTTP_GET,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					id: "id"
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Retrieve all project members
				return request.getResource("dataStore").getAllProjectMembers(request.getParameters());
			}
		},
		{
			method: HTTP_POST,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					userId: "id",
					projectId: "id"
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Add project member
				return request.getResource("dataStore").addProjectMember(request.getParameters());
			}
		}
	]
},
{
	path: "/api/projects/:projectId/members/:id",
	operations: [
		{
			method: HTTP_DELETE,
			authorization: hasSession,
			action: function(request) {

				// Validate input
				var validators = request.getResource("validators");
				var validation = validators.validateParameters(request.getParameters(), {
					id: "id",
					projectId: "id"
				});
				if(!validation) {
					return Result.invalidData;
				}

				// Add (authorized) user to request
				request.addParameter("loginId", request.getResource("user").id);

				// Remove member from project
				return request.getResource("dataStore").deleteProjectMember(request.getParameters());
			}
		}
	]
}],

// API (named) resources
resources

// Closing brackets for API constructor and createMxIAPI method
	);
};

module.exports = createMxIAPI;
