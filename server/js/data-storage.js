// Globals
var resultCodes = require("./result-codes");
var Database = require("better-sqlite3");
var db = new Database("server/db/work.db");
var statements = {};

// Data storage defines the storage operations
// The retrieval operations (operations named getXyz) receive (optional) input parameters which specify which data to retrieve.
// The insert operations (operations named addXyz) receive data to specify what to store.
// The update operations (operations named updateXyz, but also for example activateUser) receive data to specify what to update.
// The delete operations (operations named deleteXyz) receive (optional) input parameters which specify which data to delete.
var dataStorage = {
	getAllProjects: function(/* params */) {
		try {
			return statements.getAllProjects.all();
		} catch(error) {
			console.error("Retrieve all projects failed", error);
		}
		return undefined;
	},
	getProject: function(params) {
		try {
			return statements.getProject.get(params);
		} catch(error) {
			console.error("Retrieve project failed", error);
		}
		return undefined;
	},
	getMembersForProject: function(params) {
		// A project has at least 1 member (the owner)
		// If no member is found, it means the project was not found and therefore 'undefined' (ie no data found) is answered.
		try {
			var members = statements.getMembersForProject.all(params);
			if(members.length === 0) {
				return undefined;
			}
			return members;
		} catch(error) {
			console.error("Retrieve members for project failed", error);
		}
		return undefined;
	},
	getUser: function(params) {
		try {
			return statements.getUser.get(params);
		} catch(error) {
			console.error("Retrieve user failed", error);
		}
		return undefined;
	},
	getPassword: function(params) {
		try {
			return statements.getPassword.get(params);
		} catch(error) {
			console.error("Retrieve password failed", error);
		}
		return undefined;
	},
	addUser: function(data) {
		try {
			var info = statements.addUser.run(data);
			if(info.changes !== 1) {
				return undefined;
			}
			return { id: info.lastInsertROWID };
		} catch(error) {
			if(error.code === "SQLITE_CONSTRAINT_UNIQUE") {
				return resultCodes.uniqueConstraintViolation;
			}
			console.error("Add user failed", error);
		}
		return undefined;
	},
	activateUser: function(data) {
		try {
			var info = statements.activateUser.run(data);
			if(info.changes !== 1) {
				return resultCodes.noResourceFound;
			}
			return { success: true };
		} catch(error) {
			console.error("Activate user failed", error);
		}
		return undefined;
	},
	changePassword: function(data) {
		try {
			var info = statements.changePassword.run(data);
			if(info.changes !== 1) {
				return resultCodes.invalidData; // Do not leak information about user record existance
			}
			return { success: true };
		} catch(error) {
			console.error("Change password failed", error);
		}
		return undefined;
	},
	passwordForgotten: function(data) {
		try {
			var info = statements.passwordForgotten.run(data);
			if(info.changes !== 1) {
				return resultCodes.noResourceFound;	// This does not leak information because it does not reference email
			}
			return { success: true };
		} catch(error) {
			console.error("Password forgotten failed", error);
		}
		return undefined;
	},
	resetPassword: function(data) {
		try {
			var info = statements.resetPassword.run(data);
			if(info.changes !== 1) {
				return resultCodes.noResourceFound;	// This does not leak information because it does not reference email
			}
			return { success: true };
		} catch(error) {
			console.error("Reset password failed", error);
		}
		return undefined;
	},
	addSession: function(data) {
		try {
			var info = statements.addSession.run(data);
			if(info.changes !== 1) {
				return undefined;
			}
			return { token: data.token };
		} catch(error) {
			console.error("Add session failed", error);
		}
		return undefined;
	},
	updateSession: function(params, data) {
		try {
			var info = statements.updateSession.run(data);
			if(info.changes !== 1) {
				return resultCodes.noResourceFound;
			}
			return { success: true };
		} catch(error) {
			console.error("Update session failed", error);
		}
		return undefined;
	},
	deleteSession: function(params) {
		try {
			var info = statements.deleteSession.run(params);
			return { success: info.changes === 1 };
		} catch(error) {
			console.error("Delete session failed", error);
		}
		return undefined;
	},
	deleteSessions: function(params, data) {
		try {
			var info = statements.deleteSessions.run(data);
			return { count: info.changes };
		} catch(error) {
			console.error("Activate user failed", error);
		}
		return undefined;
	}
};

// Setting for performance of concurrent db access
db.pragma("journal_mode = WAL");

// Create tables (if they do not exist)
db.exec("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, passwordHash TEXT NOT NULL, activationTimestamp INTEGER NOT NULL, activationToken TEXT, activationExpiration INTEGER, passwordResetToken TEXT, passwordResetExpiration INTEGER, name TEXT, shortName TEXT, phoneNumber TEXT, skypeAddress TEXT)");
db.exec("CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY, name TEXT NOT NULL)");
db.exec("CREATE TABLE IF NOT EXISTS members(id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, projectId INTEGER NOT NULL, FOREIGN KEY (userId) REFERENCES users(id), FOREIGN KEY(projectId) REFERENCES projects(id))");
db.exec("CREATE TABLE IF NOT EXISTS sessions(id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, token TEXT UNIQUE NOT NULL, expiration INTEGER NOT NULL)");

// Update tables (per version number)
try {
	if(db.pragma("user_version", true) === 0) {
		// ...
		db.pragma("user_version = 1");
	}
	if(db.pragma("user_version", true) === 1) {
		// ...
		db.pragma("user_version = 2");
	}
} catch(error) {
	console.error("Table updates failed", error);
}

// Create prepared statements
Object.assign(statements, {
	getAllProjects: db.prepare(
		"SELECT * FROM projects"
	),
	getProject: db.prepare(
		"SELECT * FROM projects WHERE id = :projectId"
	),
	getMembersForProject: db.prepare(
		"SELECT users.id, name, shortName, email FROM users " +
			"INNER JOIN members ON users.id = members.userId " +
			"WHERE projectId = :projectId"
	),
	getUser: db.prepare(
		"SELECT id, email, phoneNumber, skypeAddress FROM users WHERE email = :email"
	),
	getPassword: db.prepare(
		"SELECT id, passwordHash FROM users WHERE email = :email"
	),
	addUser: db.prepare(
		"INSERT INTO users (email, passwordHash, activationTimestamp, activationToken, activationExpiration) " +
			"VALUES (:email, :passwordHash, 0, :activationToken, :activationExpiration)"
	),
	activateUser: db.prepare(
		"UPDATE users SET activationTimestamp = :now, activationExpiration = 0 " +
			"WHERE activationToken = :activationToken AND activationExpiration >= :now AND activationTimestamp = 0"
	),
	changePassword: db.prepare(
		"UPDATE users SET passwordHash = :newPasswordHash " +
			"WHERE email = :email AND passwordHash = :oldPasswordHash"
	),
	passwordForgotten: db.prepare(
		"UPDATE users SET passwordResetToken = :passwordResetToken, passwordResetExpiration = :passwordResetExpiration " +
			"WHERE email = :email"
	),
	resetPassword: db.prepare(
		"UPDATE users SET passwordHash = :passwordHash " +
			"WHERE passwordResetToken = :passwordResetToken AND passwordResetExpiration >= :now"
	),
	addSession: db.prepare(
		"INSERT INTO sessions (userId, token, expiration) VALUES (:userId, :token, :expiration)"
	),
	updateSession: db.prepare(
		"UPDATE sessions SET expiration = :expiration WHERE token = :token AND expiration >= :now"
	),
	deleteSession: db.prepare(
		"DELETE FROM sessions WHERE token = :sessionToken"
	),
	deleteSessions: db.prepare(
		"DELETE FROM sessions WHERE expiration < :now"
	)
});

// Export data storage
module.exports = dataStorage;
