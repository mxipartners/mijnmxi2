// Constants
var ACTIVATION_CODE_KEY = "activationToken";
var EMPTY_FUNCTION = function() {};

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
				d3.json("api/projects", function(error, data) {
					if(error) {
						console.error(error);
					} else if(data) {
						pageElement.render(data);
					}
				});
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
				d3.json("api/projects/" + app.selections.projectId + "/members", function(error, data) {
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

		// Login page
		login: {
			isUserRequired: false
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
					var emailValue = this.element.select("#registerEmailInput").property("value");
					var newPasswordValue = this.element.select("#registerNewPasswordInput").property("value");
					var verifyPasswordValue = this.element.select("#registerVerifyPasswordInput").property("value");
					if(newPasswordValue !== verifyPasswordValue) {
						notifyInvalidForm(form, "Wachtwoorden zijn niet hetzelfde");
						return;
					}
					sendPostRequest("api/users", { email: emailValue, password: newPasswordValue }, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data && data.id) {
							window.alert("Account is geregistreerd. Een mail met activatiecode is verzonden naar het opgegeven mail-adres.");
						} else {
							if(data && data.code === 409) {
								window.alert("Een account met opgegeven mail-adres bestaat al.");
							} else {
								window.alert("Het account kon niet geregistreerd worden. Controleer de gegevens en probeer opnieuw.");
							}
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
					var activationTokenValue = this.element.select("#activationTokenInput").property("value");
					sendPutRequest("api/users", { activationToken: activationTokenValue }, function(error, data) {
						if(error) {
							notifyError(error);
						} else if(data && data.id === 0) {
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

	// Selections
	selections: {}
};

// Send API request
function sendGetRequest(url, requestData, callback) {
	return sendAPIRequest(url, "GET", requestData, callback);
}

function sendPostRequest(url, requestData, callback) {
	return sendAPIRequest(url, "POST", requestData, callback);
}

function sendPutRequest(url, requestData, callback) {
	return sendAPIRequest(url, "PUT", requestData, callback);
}

function sendAPIRequest(url, method, requestData, callback) {
	d3.request(url)
		.mimeType("application/json")
		.header("Content-Type", "application/json")
		.response(function(xhr) {
			try {
				return JSON.parse(xhr.responseText);
			} catch(error) {
				console.error("Failed to parse JSON result", xhr.responseText);
			}
			return undefined;
		})
		.send(method, JSON.stringify(requestData), function(error, responseData) {
			console.log(error, responseData);
			if(callback) {
				callback(error, responseData);
			}
		})
	;
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
	if(!app.selections.user && page.isUserRequired) {

		// Decide between login or activation
		var activationToken = getActivationTokenFromURL();
		if(activationToken) {
			id = "userActivation";
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

	// Add a span after input fields which are 'required' to allow CSS to provide certain styling (which is not possible on an input element)
	d3.selectAll("input[required]").each(function() {

		// Select parent node
		var node = this;
		d3.select(node.parentNode)

			// Insert a span before the input's next sibling (ie directly after the input)
			.insert("span", function() { return node.nextSibling; })
				.attr("class", "required")
		;
	});

	// Create templates from pages
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
