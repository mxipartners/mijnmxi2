// Constants
var ACTIVATION_CODE_KEY = "activationToken";
var PASSWORD_RESET_CODE_KEY = "passwordResetToken";
var EMPTY_FUNCTION = function() {};
var HTTP_OK_NO_CONTENT = 204;

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
						console.error(error);
					} else if(data) {
						pageElement.render(data);
					}
				});
			},
			actions: {
				addElement: function() {
					app.selections.project = {
						id: null, 
						name: ""
					};
					showPage("project");
				}
			}
		},

		// Project page showing one single project
		project: {
			isUserRequired: true,
			beforeShow: function(pageElement) {
				pageElement.render(app.selections.project);
			},
			actions: {
				save: function(){
					var form = this.element.select("form");
				//	if(!validateForm(form, true)) {
					//	return;
			//		}
					var name = d3.select("#projectNameInput").property("value");
					var parameters = { 
						//id: app.selections.project.id, 
						name: name
					};
					if(app.selections.project.id === null){
						sendPostRequest("api/projects", parameters, function(error, data) {
							if(error) {
								console.error(error);
							} else if(data) {
								window.alert("Gelukt!");
							}
						});
					} else {
						sendPutRequest("api/projects/" + app.selections.project.id, parameters, function(error, data) {
							if(error) {
								console.error(error);
							} else if(data) {
								window.alert("Gelukt!");
							}
						});
					}
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
						console.error(error);
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
						console.error(error);
					} else if(data) {
						pageElement.render(data);
					}
				});
			},
			actions: {
				edit: function() {
						var form = this.element.select("form");
						if(!validateForm(form, true)) {
							return;
						}
						var name = form.select("#fullNameInput").property("value");
						var shortName = form.select("#shortNameInput").property("value");
						var phoneNumber = form.select("#phoneNumberInput").property("value");
						var skypeAddress = form.select("#skypeAddressInput").property("value");
						var parameters = { 
							name: name, 
							shortName: shortName, 
							phoneNumber: phoneNumber, 
							skypeAddress: skypeAddress
						};
						sendPutRequest("api/users/" + app.selections.user.id, parameters, function(error, data) {
						if(error) {
							console.error(error);
						} else if(data) {
							window.alert("Gelukt!");
						}
					});
				}
			}
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
					var email = form.select("#loginEmailInput").property("value");
					var password = form.select("#loginPasswordInput").property("value");
					sendPostRequest("api/sessions", { email: email, password: password }, function(error, data) {
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
							window.alert("De ingevoerde logingegevens kloppen niet!");
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
			actions: {
				passwordForgotten: function() {
					var form = this.element.select("form");
					if(!validateForm(form, true)) {
						return;
					}
					var email = form.select("#loginEmailInput").property("value");
					sendPatchRequest("api/users", { operation: "passwordForgotten", email: email }, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data) {
							window.alert("Een mail is verzonden met uw wachtwoordherstelcode!");
							removeSearchParametersFromURL();
							showPage("resetPassword");
						} else {
							window.alert("Account kon niet geactiveerd worden.");
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
					var passwordResetToken = form.select("#passwordResetTokenInput").property("value");
					var newPassword = form.select("#passwordInput").property("value");
					var verifyPassword = form.select("#verifyPasswordInput").property("value");
					if(newPassword !== verifyPassword) {
						notifyInvalidForm(form, "Wachtwoorden zijn niet hetzelfde");
						return;
					}
					sendPatchRequest("api/users", { operation: "resetPassword", passwordResetToken: passwordResetToken, password: newPassword }, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data) {
							window.alert("Wachtwoord is succesvol gewijzigd!");
							removeSearchParametersFromURL();
							showPage("home");
						} else {
							window.alert("Het nieuwe wachtwoord kon niet goed geregistreerd worden.");
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
					var email = form.select("#registerEmailInput").property("value");
					var newPassword = form.select("#registerNewPasswordInput").property("value");
					var verifyPassword = form.select("#registerVerifyPasswordInput").property("value");
					if(newPassword !== verifyPassword) {
						notifyInvalidForm(form, "Wachtwoorden zijn niet hetzelfde");
						return;
					}
					sendPostRequest("api/users", { email: email, password: newPassword }, function(error, data) {
						if(error) {
							if(error.status === 409) {
								window.alert("Een account met opgegeven mail-adres bestaat al.");
							} else {
								notifyError(error);
							}
						} else if(data) {
							window.alert("Account is geregistreerd. Een mail met activatiecode is verzonden naar het opgegeven mail-adres.");
						} else {
							window.alert("Het account kon niet geregistreerd worden. Controleer de gegevens en probeer opnieuw.");
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
					var activationToken = form.select("#activationTokenInput").property("value");
					sendPatchRequest("api/users", { operation: "activate", activationToken: activationToken }, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data) {
							window.alert("Account is succesvol geactiveerd!");
							removeSearchParametersFromURL();
							showPage("home");
						} else {
							window.alert("Account kon niet geactiveerd worden.");
						}
					});
				}
			}
		}
	},

	// Session
	session: { token: undefined },

	// Selections
	selections: {}
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
			console.error(error);
		} else if(data) {
			if(data.id === userId) {
				app.selections.user = data;
			} else {
				console.error("Retrieved incorrect user info!");
			}
		}
	});
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
		sessionToken =  app.session.token || "";
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
function showPage(id) {

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
	page.beforeShow(pageElement);
	pageElement.classed("selected", true);	// Makes page visible
	page.afterShow(pageElement);
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
				linkElement.on("click", function() {
					action();
					stopEventFully();
				});
			}
		});
	});

	// Add event handlers to list items
	d3.select("#projects li").on("click", function(d) {
		app.selections.projectId = d.id;
		showPage("members");
	});
	d3.select("#members li").on("click", function(d) {
		app.selections.memberId = d.id;
		showPage("member");
	});

	// Create templates from pages
	d3.selectAll("#templates > *").template();
	d3.selectAll(".page").template();

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

// Notify the current form is invalid
function notifyInvalidForm(formElement, message) {
	// TODO: replace with better notification (using formElement)
	window.alert("Gegevens incorrect" + (message ? ": \"" + message + "\"" : "") + ". Maak gegevens correct en probeer opnieuw.");
}

// Generic notify
function notifyError(errorOrMessage) {
	var message = errorOrMessage;
	if(errorOrMessage.message) {
		// In case of Error instance
		message = errorOrMessage.message;
	} else if(errorOrMessage.target && errorOrMessage.target.responseText) {
		// In case of XmlHTTPRequestProgressEvent
		message = errorOrMessage.target.responseText;
	}
	window.alert(message);
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
