// Globals
var Database = require("better-sqlite3");
var db = new Database("server/db/work.db");
var statements = {};

module.exports = {
	getAllProjects: function(/* params */) {
		return statements.getAllProjects.all()
	},
	getProjectWithId: function(params) {
		return statements.getProjectWithId.get(params);
	},
	getMembersForProjectWithId: function(params) {
		var members = statements.getMembersForProjectWithId.all(params);
		if(members.length === 0) {
			return undefined;
		}
		return members;
	}
};

// Setting for performance of concurrent db access
db.pragma("joural_mode = WAL");

// Create tables (if they do not exist)
db.exec("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT, shortName TEXT, email TEXT)");
db.exec("CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY, name TEXT)");
db.exec("CREATE TABLE IF NOT EXISTS members(id INTEGER PRIMARY KEY, userId INTEGER, projectId INTEGER, FOREIGN KEY (userId) REFERENCES users(id), FOREIGN KEY(projectId) REFERENCES projects(id))");
db.exec("CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, sender INTEGER, recipients TEXT, content TEXT, timestamp TEXT DEFAULT CURRENT_TIMESTAMP)");

// Create prepared statements
Object.assign(statements, {
	getAllProjects: db.prepare("SELECT * FROM projects"),
	getProjectWithId: db.prepare("SELECT * FROM projects WHERE id = :projectId"),
	getMembersForProjectWithId: db.prepare("SELECT users.id, name, shortName FROM users INNER JOIN members ON users.id = members.userId WHERE projectId = :projectId")
});
