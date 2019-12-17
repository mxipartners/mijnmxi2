// Constants
var ACTIVATION_CODE_KEY = "activationToken";
var PASSWORD_RESET_CODE_KEY = "passwordResetToken";
var EMPTY_FUNCTION = function() {};
var HTTP_OK_NO_CONTENT = 204;
var HTTP_ERROR_BAD_REQUEST = 400;
var HTTP_ERROR_UNAUTHORIZED = 401;
var HTTP_ERROR_NOT_FOUND = 404;
var HTTP_ERROR_CONFLICT = 409;
var MAX_VISIBLE_NOTIFICATIONS = 4;
var NOTIFICATION_INFO = "info";
var NOTIFICATION_ERROR = "error";
var NOTIFICATION_EMPTY = "empty";
var UPDATE_NOTIFICATION_FREQUENCY = 5000;

// Globals
var app = {

	// Pages
	//
	// The following page definitions are not real objects but will behave much like an
	// object. All methods within a page will have "this" set/bound to the page. This will
	// be done from the main initialization function "initializeAfterLoad".
	// Also all pages will receive an empty "beforeShow" and "afterShow" method if none is
	// provided in the following definition.
	// During this initialization all pages will also receive an "element" refering to the
	// d3.select() of the page. This element allows easy selection of child elements within
	// the page.
	//
	// For example:
	//    in an action select all list elements: this.element.selectAll("li")
	//    in an action select the (first) entry form: this.element.select("form")
	pages: {

		// Home page
		home: {
			isUserRequired: true
		},

		// Projects page showing the projects the currently selected user is member of (by default the logged in user is the selected user)
		projects: {
			isUserRequired: true,
			beforeShow: function(pageElement) {
				sendGetRequest("api/projects", function(error, data) {
					if(error) {
						notifyError(error);
					} else if(data) {
						pageElement.render(data);
					}
				});
			},
			actions: {
				showProject: function(d) {
					app.selections.project = d;
					showPage("project", d);
				},
				removeMe: function(d) {
					sendDeleteRequest("api/projects/" + d.id + "/members/" + d.memberMeId, function(error, data) {
						if(error) {
							notifyError(error);
						} else {
							notifyInfo("Je bent verwijderd als deelnemer");
							showPage("projects");
						}
					});
				}
			}
		},

		// Project page for showing project
		project: {
			isUserRequired: true,
			beforeShow: function(pageElement, project) {
				project = project || app.selections.project;
				sendGetRequest("api/projects/" + project.id + "/members", function(error, data) {
					if(error) {
						notifyError(error);
					} else if(data) {
						project.members = data;
						pageElement.render(project);
					}
				});
			},
			actions: {
				edit: function(d) {
					app.selections.project = d;
					app.selections.projectId = d.id;
					showPage("editProject", d);
				},
				remove: function(d) {
					notifyError("Not implemented yet");
				}
			}
		},

		// Project page for editing project
		editProject: {
			isUserRequired: true,
			beforeShow: function(pageElement, project) {
				pageElement.render(project || app.selections.project);
			},
			actions: {
				save: function(d) {
					var form = this.element.select("form");
					if(!validateForm(form, true)) {
						return;
					}
					var input = extractInput({
						name: "#projectNameInput"
					});
					if(!d.id) {
						sendPostRequest("api/projects", input, function(error, data) {
							if(error) {
								notifyError(error);
							} else if(data) {
								d.id = data.id;
								notifyInfo("Project succesvol opgeslagen");
							}
						});
					} else {
						sendPutRequest("api/projects/" + d.id, input, function(error, data) {
							if(error) {
								notifyError(error);
							} else if(data) {
								Object.assign(d, input);
								notifyInfo("Project succesvol opgeslagen");
							}
						});
					}
				}
			}
		},

		// Select members for a project
		selectMembers: {
			isUserRequired: true,
			beforeShow: function(pageElement) {
				sendGetRequest("api/users", function(error, data) {
					if(error) {
						notifyError(error);
					} else if(data) {
						data = data.filter(function(user) {
							return app.selections.project.members.findIndex(function(projectMember) {
								return projectMember.userId === user.id;
							}) < 0;
						});
						pageElement.render(data);
					}
				});
			},
			actions: {
				save: function(d) {
					var selectedOptions = d3.select("#memberSelection").property("selectedOptions");
					var users = [];
					for(var i = 0; i < selectedOptions.length; i++) {
						users.push(d3.select(selectedOptions[i]).datum());
					}
					var project = app.selections.project;

					// Create two helpers functions to save members one-by-one (because of async nature REST API calls)
					var saveMember = function(user, whenDoneDo) {
						var member = {
							userId: user.id
						};
						sendPostRequest("api/projects/" + project.id + "/members", member, function(error, data) {
							if(error) {
								if(error.status === HTTP_ERROR_CONFLICT) {
									notifyError("Gebruiker " + user.name + " is al deelnemer van dit project");
								} else {
									notifyError(error);
								}
							} else if(data) {
								notifyInfo("Deelnemer " + user.name + " toegevoegd");
							}
							whenDoneDo();
						});
					};
					var saveMembers = function(users) {
						if(users.length > 0) {
							var user = users.splice(0, 1)[0];
							saveMember(user, function whenDoneDo() {
								saveMembers(users);
							});
						}
					};

					// Start saving members
					saveMembers(users);
				}
			}
		},
		
		// Members page showing all members of the currently selected project
		members: {
			isUserRequired: true,
			beforeShow: function(pageElement) {
				if(!app.selections.projectId) {
					console.error("No project selected!");
					return;
				}
				sendGetRequest("api/projects/" + app.selections.projectId + "/members", function(error, data) {
					if(error) {
						notifyError(error);
					} else if(data) {
						pageElement.render(data);
					}
				});
			}
		},

		// Member page showing the details of a project member
		member: {
			isUserRequired: true,
			beforeShow: function(pageElement) {
				if(!app.selections.memberId) {
					console.error("No member selected!");
					return;
				}
				//pageElement.render(app.selections.member);
				console.log("Show member with id " + app.selections.memberId);
			}
		},

		//Profile page to edit personal details
		profile: {
			isUserRequired: true,
			beforeShow: function(pageElement) {
				if(!app.selections.user) {
					console.error("No user selected!");
					return;
				}
				sendGetRequest("api/users/" + app.selections.user.id, function(error, data) {
					if(error) {
						notifyError(error);
					} else if(data) {
						pageElement.render(data);
					}
				});
			},
			actions: {
				update: function() {
					var form = this.element.select("form");
					if(!validateForm(form, true)) {
						return;
					}
					var input = extractInput({
						name: "#fullNameInput",
						shortName: "#shortNameInput",
						phoneNumber: "#phoneNumberInput",
						skypeAddress: "#skypeAddressInput"
					});
					sendPutRequest("api/users/" + app.selections.user.id, input, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data) {
							window.alert("Gelukt!");
						}
					});
				}
			},
		},

		// Login page
		login: {
			isUserRequired: false,
			actions: {
				login: function() {
					var form = this.element.select("form");
					if(!validateForm(form, true)) {
						return;
					}
					var input = extractInput({
						email: "#loginEmailInput",
						password: "#loginPasswordInput"
					});
					sendPostRequest("api/sessions", input, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data && data.token) {
							app.session.token = data.token;
							app.selections.user = { id: data.userId };
							loadUser();
							try {
								window.localStorage.setItem("sessionToken", data.token);
								window.localStorage.setItem("userId", data.userId);
							} catch(error) {
								console.error("Can't store sessionToken and/or userId", error);
							}
							showPage("home");
						} else {
							notifyError("De ingevoerde logingegevens kloppen niet!");
						}
					});
				},
				userRegistration: function() {
					showPage("userRegistration");
				},
				passwordForgotten: function() {
					showPage("passwordForgotten");
				}
			}
		},

		// Logout page
		logout: {
			isUserRequired: true,
			beforeShow: function(pageElement) {
				// Remove all session state, but remember session token for deleting it
				var sessionToken = app.session.token;
				app.selections = {};
				try {
					window.localStorage.removeItem("sessionToken");
					window.localStorage.removeItem("userId");
					loadUser();
				} catch(error) {
					console.error("Can't remove sessionToken and/or userId", error);
				}
				sendDeleteRequest("api/sessions/" + sessionToken, function(error, data) {
					if(error) {
						console.error(error);
					} else if(data) {
						console.log("Delete session success: " + data);
					}
				});
			}
		},

		// Password forgotten page
		passwordForgotten: {
			isUserRequired: false,
			beforeShow: function() {
				// Copy the email address already filled in on login screen
				d3.select("#passwordForgottenEmailInput").property("value", d3.select("#loginEmailInput").property("value"));
			},
			actions: {
				passwordForgotten: function() {
					var form = this.element.select("form");
					if(!validateForm(form, true)) {
						return;
					}
					var input = extractInput({
						email: "#passwordForgottenEmailInput"
					});
					Object.assign(input, { operation: "sendPasswordResetMail" });
					sendPatchRequest("api/users", input, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data) {
							notifyInfo("Een mail is verzonden met uw wachtwoordherstelcode!");
							removeSearchParametersFromURL();
							showPage("resetPassword");
						} else {
							notifyError("Account kon niet geactiveerd worden.");
						}
					});
				}
			}
		},

		// Reset password page
		resetPassword: {
			isUserRequired: false,
			beforeShow: function(pageElement) {
				var passwordResetToken = getPasswordResetTokenFromURL();
				if(passwordResetToken) {
					pageElement.select("#passwordResetTokenInput").property("value", passwordResetToken);
				}
			},
			actions: {
				resetPassword: function() {
					var form = this.element.select("form");
					if(!validateForm(form, true)) {
						return;
					}
					var input = extractInput({
						passwordResetToken: "#passwordResetTokenInput",
						password: "#passwordInput",
						verifyPassword: "#verifyPasswordInput"
					});

					// Validate both passwords are equal (and remove verified password after use)
					if(input.password !== input.verifyPassword) {
						notifyInvalidForm(form, "Wachtwoorden zijn niet hetzelfde");
						return;
					}
					delete input.verifyPassword;

					Object.assign(input, { operation: "resetPassword" });
					sendPatchRequest("api/users", input, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data) {
							notifyInfo("Wachtwoord is succesvol gewijzigd!");
							removeSearchParametersFromURL();
							showPage("home");
						} else {
							notifyError("Het nieuwe wachtwoord kon niet goed geregistreerd worden.");
						}
					});
				}
			}
		},

		// User registration page where a new user can register to request access to the app
		userRegistration: {
			isUserRequired: false,
			actions: {
				register: function() {
					var form = this.element.select("form");
					if(!validateForm(form, true)) {
						return;
					}
					var input = extractInput({
						email: "#registerEmailInput",
						password: "#registerNewPasswordInput",
						verifyPassword: "#registerVerifyPasswordInput"
					});

					// Validate both passwords are equal (and remove verified password after use)
					if(input.password !== input.verifyPassword) {
						notifyInvalidForm(form, "Wachtwoorden zijn niet hetzelfde");
						return;
					}
					delete input.verifyPassword;

					sendPostRequest("api/users", input, function(error, data) {
						if(error) {
							if(error.status === 409) {
								notifyError("Een account met opgegeven mail-adres bestaat al.");
							} else {
								notifyError(error);
							}
						} else if(data) {
							notifyInfo("Account is geregistreerd. Een mail met activatiecode is verzonden naar het opgegeven mail-adres.");
						} else {
							notifyError("Het account kon niet geregistreerd worden. Controleer de gegevens en probeer opnieuw.");
						}
					});
				}
			}
		},

		// User activation page where a (new) user can activate the requested access to the app (using a received activation token)
		userActivation: {
			isUserRequired: false,
			beforeShow: function(pageElement) {
				var activationToken = getActivationTokenFromURL();
				if(activationToken) {
					pageElement.select("#activationTokenInput").property("value", activationToken);
				}
			},
			actions: {
				activate: function() {
					var form = this.element.select("form");
					if(!validateForm(form, true)) {
						return;
					}
					var input = extractInput({
						activationToken: "#activationTokenInput"
					});
					Object.assign(input, { operation: "activate" });
					sendPatchRequest("api/users", input, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data) {
							notifyInfo("Account is succesvol geactiveerd!");
							removeSearchParametersFromURL();
							showPage("home");
						} else {
							notifyError("Account kon niet geactiveerd worden.");
						}
					});
				}
			}
		}
	},

	// Main actions
	actions: {
		dial: function() {
			notifyError("Not implemented yet");
		},
		logout: function() {
			showPage("logout");
		},
		me: function() {
			notifyError("Not implemented yet");
		},
		message: function() {
			notifyError("Not implemented yet");
		},
		call: function() {
			notifyError("Not implemented yet");
		},
		add: function() {
			if(app.activePageId === "projects") {
				showPage("editProject", { name: "Nieuw project" });
			} else if(app.activePageId === "project") {
				showPage("selectMembers");
			}
		}
	},

	// Active page id
	activePageId: null,

	// Session
	session: { token: undefined },

	// Selections
	selections: {},

	// Notifications
	notifications: [],
	notificationUpdater: null
};

// Specific API calls
function loadUser() {

	// Get current user id (if present)
	var userId = app.selections.user && app.selections.user.id;
	if(!userId) {
		return;
	}

	// Load current user
	sendGetRequest("api/users/" + userId, function(error, data) {
		if(error) {
			notifyError(error);
		} else if(data) {
			if(data.id === userId) {
				app.selections.user = data;
			} else {
				notifyError("Gebruikersinformatie kan niet ingelezen worden");
			}
		}
	});
}

// Input retrieval
function extractInput(descriptor) {
	var input = {};
	Object.keys(descriptor).forEach(function(key) {
		var valueHolder = d3.select(descriptor[key]);
		if(valueHolder.attr("type") === "checkbox") {
			input[key] = valueHolder.property("checked") ? 1 : 0;
		} else {
			// This works for input, textarea and select
			input[key] = valueHolder.property("value");
		}
	});

	return input;
}

// Send API request
function sendGetRequest(url, callback) {
	return sendAPIRequest(url, "GET", null, callback);
}

function sendPostRequest(url, requestData, callback) {
	return sendAPIRequest(url, "POST", requestData, callback);
}

function sendPutRequest(url, requestData, callback) {
	return sendAPIRequest(url, "PUT", requestData, callback);
}

function sendPatchRequest(url, requestData, callback) {
	return sendAPIRequest(url, "PATCH", requestData, callback);
}

function sendDeleteRequest(url, callback) {
	return sendAPIRequest(url, "DELETE", null, callback);
}

function sendAPIRequest(url, method, requestData, callback) {
	var sessionToken = "";
	if(app.session) {
		sessionToken = app.session.token || "";
	}
	fetch(url, {
		method: method,
		headers: {
			"Content-Type": "application/json",
			"X-Session-Token": sessionToken
		},
		body: requestData === null ? null : JSON.stringify(requestData),
		mode: "cors",
		redirect: "follow",
		referrer: "no-referrer",
		referrerPolicy: "no-referrer",
		credentials: "omit",
		cache: "no-store"
	}).then(function(response) {
		// If response unsuccessful throw exception, but keep status code
		if(!response.ok) {
			console.log(requestData);
			var error = new Error(response.status + " " + response.statusText);
			error.status = response.status;
			throw error;
		}
		return response.status === HTTP_OK_NO_CONTENT ? true : response.json();
	}).then(function(json) {
		callback(null, json);
	}).catch(function(error) {
		callback(error, null);
	});
}

// Show page
function showPage(id, data) {

	// Retrieve page based on id
	var page = app.pages[id];
	if(!page) {
		console.error("Internal error. Unknown page: " + id);
		return;
	}

	// Check if user is logged in and if not redirect to relevant page
	if(!(app.selections.user && app.selections.user.id) && page.isUserRequired) {

		// Decide between login, activation or password reset
		var activationToken = getActivationTokenFromURL();
		var passwordResetToken = getPasswordResetTokenFromURL();
		if(activationToken) {
			id = "userActivation";
			page = app.pages[id];
		} else if(passwordResetToken) {
			id = "resetPassword";
			page = app.pages[id];
		} else {
			id = "login";
			page = app.pages[id];
		}
	}

	// Hide all other pages
	d3.selectAll(".page")
		.filter(function() { return d3.select(this).attr("id") !== id; })
		.classed("selected", false)
	;

	// Show page
	pageElement = d3.select("#" + id);
	page.beforeShow(pageElement, data);
	pageElement.classed("selected", true);	// Makes page visible
	page.afterShow(pageElement);

	// Keep track of page which is active
	app.activePageId = id;
}

// Notification functions
function addNotification(notification) {
	var index = app.notifications.findIndex(function(existingNotification) {
		return existingNotification.message === notification.message;
	});
	if(index >= 0) {

		// Update existing notification
		app.notifications[index].count++;
		app.notifications[index].timestamp = Date.now();
		if(app.notifications[index].timeout && notification.timeout) {
			app.notifications[index].timeout = notification.timeout;
		}
	} else {

		// Create new notification
		notification.count = 1;
		notification.timestamp = Date.now();
		app.notifications.push(notification);
	}
	renderNotifications();
}

function removeNotification(index) {
	app.notifications[index].type = NOTIFICATION_EMPTY;
	renderNotifications();
}

function removeAllNotifications() {
	app.notifications.forEach(function(existingNotification) {
		existingNotification.type = NOTIFICATION_EMPTY;
	});
	renderNotifications();
}

function renderNotifications() {

	// Check which notifications have expired
	var now = Date.now();
	app.notifications.forEach(function(existingNotification) {
		if(now >= existingNotification.timestamp + existingNotification.timeout) {
			existingNotification.type = NOTIFICATION_EMPTY;
		}
	});

	// Make only top most visible
	var lastIndex = app.notifications.length - MAX_VISIBLE_NOTIFICATIONS;
	var foundEmpty = false;
	app.notifications.forEach(function(existingNotification, index) {
		if(existingNotification.type == NOTIFICATION_EMPTY) {
			foundEmpty = true;
		}
		existingNotification.visualType = index >= lastIndex ?
			existingNotification.type :
			"hidden"
		;
	});

	// Render notifications
	d3.selectAll(".notification.empty").remove();
	app.notificationsTemplate.render(app.notifications);

	// Cleanup any empty notifications
	app.notifications = app.notifications.filter(function(existingNotification) {
		return existingNotification.type !== NOTIFICATION_EMPTY;
	});

	// Update notifications every 5 seconds
	if(app.notificationUpdater) {
		window.clearTimeout(app.notificationUpdater);
	}
	app.notificationUpdater = window.setTimeout(renderNotifications, foundEmpty ? 700 : UPDATE_NOTIFICATION_FREQUENCY);
}

function notifyInfo(message, timeout) {
	addNotification({ type: NOTIFICATION_INFO, message: message, timeout: timeout });
}

function notifyError(errorOrMessage, timeout) {
	var message = errorOrMessage;
	if(errorOrMessage.message) {
		// In case of Error instance
		message = errorOrMessage.message;
	}

	// Handle specific HTTP responses
	var nextPage;
	if(errorOrMessage.status) {
		if(errorOrMessage.status === HTTP_ERROR_UNAUTHORIZED) {
			message = "Uw sessie is verlopen of u heeft geen toegangsrechten tot de gevraagde informatie. Log opnieuw in.";
			nextPage = "login";
		} else if(errorOrMessage.status === HTTP_ERROR_NOT_FOUND) {
			message = "Gegevens zijn niet beschikbaar. Mogelijk zijn deze ondertussen door andere gebruiker verwijderd.";
		} else if(errorOrMessage.status === HTTP_ERROR_CONFLICT) {
			message = "Gegevens zijn niet correct. Mogelijk heeft een andere gebruiker ondertussen een wijziging gemaakt.";
		} else if(errorOrMessage.status === HTTP_ERROR_BAD_REQUEST) {
			message = "Ingevoerde gegevens zijn niet correct. Pas deze aan en probeer opnieuw.";
		}
	}

	addNotification({ type: NOTIFICATION_ERROR, message: message, timeout: timeout });
	if(nextPage) {
		showPage(nextPage);
	}
}

function notifyInvalidForm(formElement, message) {
	addNotification({ type: NOTIFICATION_ERROR, message: "Gegevens incorrect" + (message ? ": \"" + message + "\"" : "") + ". Maak gegevens correct en probeer opnieuw." });
}

function formattedNotificationTimestamp(timestamp) {
	var now = Date.now();
	var seconds = Math.floor((now - timestamp) / 1000);
	var minutes = Math.floor(seconds / 60);
	var hours = Math.floor(minutes / 60);

	if(hours === 0) {
		if(minutes === 0) {
			if(seconds < 30) {
				return "";
			} else {
				return "(halve minuut geleden)";
			}
		} else if(minutes === 1) {
			return "(minuut geleden)";
		} else {
			return "(" + minutes + " minuten geleden)";
		}
	} else {
		return "(meer dan uur geleden)";
	}
}

// Initialize app after full page is loaded
function initializeAfterLoad() {

	// Get previously stored session token
	try {
		app.session.token = window.localStorage.getItem("sessionToken") || undefined;
		app.selections.user = { id: +window.localStorage.getItem("userId") || undefined };
		loadUser();
	} catch(error) {
		console.error("Can't retrieve sessionToken and/or userId");
	}

	// Initialize pages in app
	Object.keys(app.pages).forEach(function(pageId) {

		// Validate page exists in DOM as well
		var pageElement = d3.select("#" + pageId);
		if(pageElement.size() !== 1) {
			console.error("Internal Error. Unknown page with id " + pageId + " in app.");
			return;
		}

		// Add element to page for easy selection of child elements
		page = app.pages[pageId];
		page.element = pageElement;

		// Add 'empty' defaults to page
		if(page.beforeShow === undefined) {
			page.beforeShow = EMPTY_FUNCTION;
		}
		if(page.afterShow === undefined) {
			page.afterShow = EMPTY_FUNCTION;
		}
		if(page.actions === undefined) {
			page.actions = {};
		}

		// Bind 'this' to page actions/methods
		Object.keys(page.actions).forEach(function(actionId) {

			// Replace action with bound action
			var action = page.actions[actionId];
			page.actions[actionId] = action.bind(page);
		});
	});

	// Add event handlers for main functions
	d3.select("#dial-button").on("click", app.actions.dial);
	d3.select("#logout-button").on("click", app.actions.logout);
	d3.select("#me-button").on("click", app.actions.me);
	d3.select("#message-button").on("click", app.actions.message);
	d3.select("#call-button").on("click", app.actions.call);
	d3.select("#add-button").on("click", app.actions.add);

	// Add event handlers to navigation links (this is independent of location of links)
	d3.selectAll("a.nav").each(function() {
		var linkElement = d3.select(this);
		var href = linkElement.attr("href");
		if(href && href.startsWith("#")) {

			// Validate page exists in app
			var pageId = href.slice(1);	// Remove "#"
			if(!app.pages[pageId]) {
				console.error("Internal Error. Unknown pageId " + pageId + " in link.");
				return;
			}

			// Add event handler
			linkElement.on("click", function() {
				showPage(pageId);
				stopEventFully();
			});
		}
	});

	// Add event handlers to action links (this is dependent on page where link is located)
	d3.selectAll(".page").each(function() {

		// Validate page exists in app
		var pageElement = d3.select(this);
		var pageId = pageElement.attr("id");
		var page = app.pages[pageId];
		if(!page) {
			console.error("Internal Error. Unknown pageId " + pageId + " in html.");
			return;
		}

		// Handle action links within page
		pageElement.selectAll("a.action").each(function() {
			var linkElement = d3.select(this);
			var href = linkElement.attr("href");
			if(href && href.startsWith("#")) {

				// Validate action exists
				var actionId = href.slice(1);	// Remove "#"
				var action = page.actions[actionId];
				if(!action) {
					console.error("Internal Error. Unknown actionId " + actionId + " in link on page " + pageId + ".");
					return;
				}

				// Add event handler
				linkElement.on("click", function(d) {
					action(d);
					stopEventFully();
				});
			}
		});
	});

	// Add event handlers to list items
	d3.select("#members li").on("click", function(d) {
		app.selections.memberId = d.id;
		showPage("member");
	});

	// Add event handlers to notification items
	d3.select("#notifications .close").on("click", function() {
		var dataIndex = d3.select(this).attr("data-index");
		if(dataIndex) {
			removeNotification(+dataIndex);
		}
	});

	// Create templates from pages
	d3.selectAll("#templates > *").template();
	d3.selectAll(".page").template();

	// Create templates for notifications
	app.notificationsTemplate = d3.select("#notifications").template();

	// Show home page
	showPage("home");
}

// Prevent event from further propagation/bubbling and prevent default actions
function stopEventFully() {
	d3.event.stopPropagation();
	d3.event.preventDefault();
}

// Validate the given form
function validateForm(formElement, doNotify) {
	if(!formElement.node().checkValidity()) {
		if(doNotify) {
			notifyInvalidForm(formElement);
		}
		return false;
	}
	return true;
}

// Answer the activation token from the URL
function getActivationTokenFromURL() {
	var searchParameters = getSearchParametersFromURL();
	if(searchParameters && searchParameters[ACTIVATION_CODE_KEY] && searchParameters[ACTIVATION_CODE_KEY].length > 0) {
		return searchParameters[ACTIVATION_CODE_KEY];
	}
	return undefined;
}

// Answer the password reset token from the URL
function getPasswordResetTokenFromURL() {
	var searchParameters = getSearchParametersFromURL();
	if(searchParameters && searchParameters[PASSWORD_RESET_CODE_KEY] && searchParameters[PASSWORD_RESET_CODE_KEY].length > 0) {
		return searchParameters[PASSWORD_RESET_CODE_KEY];
	}
	return undefined;
}

// Answer an object containing the key/values specified in the URL
// If a key is specified more than once, only the last value will be kept (ie ...?a=b&a=c will answer {"a":"c"}).
function getSearchParametersFromURL() {

	// Return if no search parameter present on URL
	if(!document.location.search) {
		return undefined;
	}

	// Split search parameter into individual values
	var parameterString = document.location.search.slice(1);	// Remove leading "?"
	var parameters = {};

	// Retrieve all keys (all "<key>[=<value>]" pairs which are separated by "&")
	var keyValues = parameterString.split("&");
	if(keyValues.length > 0) {
		keyValues.forEach(function(keyValue) {

			// Retrieve value (if any) for the current key
			var result = keyValue.replace(/\+/g, " ").split("=");
			if(result.length > 0 && result[0].length > 0) {

				// If no value is given an empty string will be stored
				parameters[decodeURIComponent(result[0])] = result.length === 2 ? decodeURIComponent(result[1]) : "";
			}
		});
	}

	return parameters;
}

function removeSearchParametersFromURL() {
	var newURL = document.location.origin + document.location.pathname;
	if(history.pushState) {
		history.pushState({ path: newURL }, "", newURL);
	} else {
		document.location.href = newURL;
	}
}

// Start app by initialization after the page is fully loaded
window.addEventListener("load", function() {
	initializeAfterLoad();
});
