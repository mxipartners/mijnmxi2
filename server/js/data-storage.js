// Globals
var Database = require("better-sqlite3");
var db = new Database("server/db/work.db");
var statements = {};
var dataStorage = {
	getAllProjects: function(/* params */) {
		return statements.getAllProjects.all()
	},
	getProjectWithId: function(params) {
		return statements.getProjectWithId.get(params);
	},
	getMembersForProjectWithId: function(params) {
		// A project has at least 1 member (the owner)
		// If no member is found, it means the project was not found and therefore 'undefined' (ie no data found) is answered.
		var members = statements.getMembersForProjectWithId.all(params);
		if(members.length === 0) {
			return undefined;
		}
		return members;
	},
	addUser: function(data) {
		var info = statements.addUser.run(data);
		if(info.changes !== 1) {
			return undefined;
		}
		return { id: info.lastInsertROWID };
	}
};

// Setting for performance of concurrent db access
db.pragma("journal_mode = WAL");

// Create tables (if they do not exist)
db.exec("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, passwordHash TEXT, active INTEGER NOT NULL, name TEXT, shortName TEXT, phoneNumber TEXT, skypeAddress TEXT)");
db.exec("CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY, name TEXT NOT NULL)");
db.exec("CREATE TABLE IF NOT EXISTS members(id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, projectId INTEGER NOT NULL, FOREIGN KEY (userId) REFERENCES users(id), FOREIGN KEY(projectId) REFERENCES projects(id))");
db.exec("CREATE TABLE IF NOT EXISTS userManagement(id INTEGER PRIMARY KEY, action TEXT NOT NULL, code TEXT NOT NULL, expiration TEXT NOT NULL)");

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
	getProjectWithId: db.prepare(
		"SELECT * FROM projects WHERE id = :projectId"
	),
	getMembersForProjectWithId: db.prepare(
		"SELECT users.id, name, shortName, email FROM users " +
			"INNER JOIN members ON users.id = members.userId " +
			"WHERE projectId = :projectId"
	),
	addUser: db.prepare(
		"INSERT INTO users (email, active) VALUES (:email, 0)"
	)
});

// Export data storage
module.exports = dataStorage;
