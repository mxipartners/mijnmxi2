// Import classes and objects
const Database = require("better-sqlite3");
const statements = require("./data/statements");
const Result = require("./api/result");

// Globals
const db = new Database("server/db/work.db");
const dataStore = {};

// Setting for performance of concurrent db access
db.pragma("journal_mode = WAL");

// Create tables (if they do not exist)
db.exec("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, passwordHash TEXT NOT NULL, activationTimestamp INTEGER NOT NULL, activationToken TEXT, activationExpiration INTEGER, passwordResetToken TEXT, passwordResetExpiration INTEGER, name TEXT, shortName TEXT, phoneNumber TEXT, skypeAddress TEXT)");
db.exec("CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, name TEXT NOT NULL)");
db.exec("CREATE TABLE IF NOT EXISTS members(id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, projectId INTEGER NOT NULL, FOREIGN KEY (userId) REFERENCES users(id), FOREIGN KEY(projectId) REFERENCES projects(id))");
db.exec("CREATE TABLE IF NOT EXISTS sessions(id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, token TEXT UNIQUE NOT NULL, expiration INTEGER NOT NULL)");

// Update tables (per version number)
try {
/*
	if(db.pragma("user_version", true) === 0) {
		// ...
		db.pragma("user_version = 1");
	}
	if(db.pragma("user_version", true) === 1) {
		// ...
		db.pragma("user_version = 2");
	}
*/
} catch(error) {
	console.error("Table updates failed", error);
}

// Object: Data store defines the storage operations
// The retrieval operations (operations named getXyz) receive (optional) input parameters which specify which data to retrieve.
// The insert operations (operations named addXyz) receive data to specify what to store.
// The update operations (operations named updateXyz, but also for example activateUser) receive data to specify what to update.
// The delete operations (operations named deleteXyz) receive (optional) input parameters which specify which data to delete.
addStorageOperation("addUser", statements.SingleCreateStatement,
	"INSERT INTO users (email, passwordHash, activationTimestamp, activationToken, activationExpiration) " +
		"VALUES (:email, :passwordHash, 0, :activationToken, :activationExpiration)"
);
addStorageOperation("activateUser", statements.SingleUpdateStatement,
	"UPDATE users SET activationTimestamp = :now, activationExpiration = 0 " +
		"WHERE activationToken = :activationToken AND activationExpiration >= :now AND activationTimestamp = 0"
);
addStorageOperation("setPasswordResetForUser", statements.SingleUpdateStatement,
	"UPDATE users SET passwordResetToken = :passwordResetToken, passwordResetExpiration = :passwordResetExpiration " +
		"WHERE email = :email"
);
addStorageOperation("resetPassword", statements.SingleUpdateStatement,
	"UPDATE users SET passwordHash = :passwordHash " +
		"WHERE passwordResetToken = :passwordResetToken AND passwordResetExpiration >= :now"
);
addStorageOperation("updatePassword", statements.SingleUpdateStatement,
	"UPDATE users SET passwordHash = :passwordHash " +
		"WHERE id = :loginId"
);
addStorageOperation("updateUser", statements.SingleUpdateStatement,
	"UPDATE users SET name = :name, shortName = :shortName, phoneNumber = :phoneNumber, skypeAddress = :skypeAddress " +
		"WHERE id = :loginId"
);
addStorageOperation("getUser", statements.SingleReadStatement,
	"SELECT id, name, shortName, email, phoneNumber, skypeAddress FROM users WHERE id = :id"
);
addStorageOperation("privateGetUser", statements.SingleReadStatement,
	"SELECT id, email, phoneNumber, skypeAddress FROM users " +
		"WHERE id IN (SELECT userId FROM sessions WHERE token = :token)"
);
addStorageOperation("privateGetPasswordHash", statements.SingleReadStatement,
	"SELECT id, passwordHash FROM users WHERE email = :email"
);
addStorageOperation("addSession", statements.SingleCreateStatement,
	"INSERT INTO sessions (userId, token, expiration) VALUES (:userId, :token, :expiration)"
);
addStorageOperation("updateSession", statements.SingleUpdateStatement,
	"UPDATE sessions SET expiration = :expiration WHERE token = :token AND expiration >= :now"
);
addStorageOperation("getAllUsers", statements.MultiReadStatement,
	"SELECT id, name, shortName FROM users"
);
addStorageOperation("addProject", statements.SingleCreateStatement,
	"INSERT INTO projects (userId, name) " +
		"VALUES (:userId, :name)"
);
addStorageOperation("deleteSession", statements.SingleDeleteStatement,
	"DELETE FROM sessions WHERE token = :token"
);
addStorageOperation("deleteSessions", statements.MultiDeleteStatement,
	"DELETE FROM sessions WHERE expiration < :now"
);
addStorageOperation("getProject", statements.SingleReadStatement,
	"SELECT id, name FROM projects " +
		"WHERE id = :id AND userId = :loginId"
);
addStorageOperation("getAllProjects", statements.MultiReadStatement,
	"SELECT projects.id, name, members.id AS memberMeId FROM projects, members " +
		"WHERE projects.id = members.projectId AND members.userId = :loginId"
);
addStorageOperation("updateProject", statements.SingleUpdateStatement,
	"UPDATE projects SET name = :name " +
		"WHERE id = :id AND userId = :loginId"
);
addStorageOperation("deleteProject", statements.SingleDeleteStatement,
	"DELETE FROM projects WHERE id = :id AND userId = :loginId"
);
addStorageOperation("addProjectMember", statements.SingleCreateStatement,
	"INSERT INTO members (userId, projectId) " +
		"VALUES (" +
			"(CASE " +
				"WHEN (EXISTS (SELECT id FROM members WHERE userId = :userId AND projectId = :projectId)) THEN NULL " +
				"ELSE :userId " +
			"END), " + 
			":projectId" +
		")"
);
addStorageOperation("getAllProjectMembers", statements.MultiReadStatement,
	"SELECT members.id, userId, shortName, name FROM members, users " +
		"WHERE projectId = :projectId AND " +
			"EXISTS (SELECT * FROM members WHERE userId = :loginId AND projectId = :projectId) AND " +
			"users.id = members.userId"
// );
// addStorageOperation("matchProjectsOfUser", statements.MultiReadStatement,
	// "SELECT projects.id FROM users, sessions, projects WHERE users.id = sessions.userid" +
	
	// "SELECT members.id, userId, shortName, name FROM members, users " +
		// "WHERE projectId = :projectId AND " +
			// "EXISTS (SELECT * FROM members WHERE userId = :loginId AND projectId = :projectId) AND " +
			// "users.id = members.userId"
);
addStorageOperation("deleteProjectMember", statements.SingleDeleteStatement,
	"DELETE FROM members " +
		"WHERE id = :memberId AND projectId = :projectId"
);

// Helper function to create data store statements
function addStorageOperation(name, statementClass, sqlStatement) {

	// Add statement to global statements object
	statements[name] = new statementClass(db, sqlStatement);

	// Add operation to global data store object
	dataStore[name] = function(params) {
		var result = statements[name].execute(params, Result);
		if(!result.isOk()) {
			console.error("Failure occurred in " + name);
		}
		return result;
	};
}

module.exports = dataStore;
