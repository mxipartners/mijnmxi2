PRAGMA temp_store = 2;

CREATE TEMP TABLE tmp_ids (name TEXT PRIMARY KEY, value INTEGER);

-- Add users
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member0@mxi.nl", "Test Member0", "TesMe0", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member1@mxi.nl", "Test Member1", "TesMe1", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m1", (SELECT last_insert_rowid()));
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member2@mxi.nl", "Test Member2", "TesMe2", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m2", (SELECT last_insert_rowid()));
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member3@mxi.nl", "Test Member3", "TesMe3", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m3", (SELECT last_insert_rowid()));
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member4@mxi.nl", "Test Member4", "TesMe4", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m4", (SELECT last_insert_rowid()));
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member5@mxi.nl", "Test Member5", "TesMe5", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m5", (SELECT last_insert_rowid()));
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member6@mxi.nl", "Test Member6", "TesMe6", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m6", (SELECT last_insert_rowid()));
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member7@mxi.nl", "Test Member7", "TesMe7", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m7", (SELECT last_insert_rowid()));
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member8@mxi.nl", "Test Member8", "TesMe8", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m8", (SELECT last_insert_rowid()));
INSERT INTO users (email, name, shortName, phoneNumber, passwordHash, activationTimestamp, activationExpiration)
	VALUES ("member9@mxi.nl", "Test Member9", "TesMe9", "06-12345678", "$2b$10$jN6uztygFV4fnPUnICMRj.vM7HSDO2/sFDZYY9TLHZZqfz/szFxuy|1571225155646", 1571225155646, 0);
INSERT INTO tmp_ids (name, value) VALUES ("m9", (SELECT last_insert_rowid()));

-- Add projects
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m1"), "Project1 van Member1");
INSERT INTO tmp_ids (name, value) VALUES ("p1_m1", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m1"), "Project2 van Member1");
INSERT INTO tmp_ids (name, value) VALUES ("p2_m1", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m1"), "Project3 van Member1");
INSERT INTO tmp_ids (name, value) VALUES ("p3_m1", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m2"), "Project1 van Member2");
INSERT INTO tmp_ids (name, value) VALUES ("p1_m2", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m2"), "Project2 van Member2");
INSERT INTO tmp_ids (name, value) VALUES ("p2_m2", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m2"), "Project3 van Member2");
INSERT INTO tmp_ids (name, value) VALUES ("p3_m2", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m3"), "Project1 van Member3");
INSERT INTO tmp_ids (name, value) VALUES ("p1_m3", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m3"), "Project2 van Member3");
INSERT INTO tmp_ids (name, value) VALUES ("p2_m3", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m3"), "Project3 van Member3");
INSERT INTO tmp_ids (name, value) VALUES ("p3_m3", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m4"), "Project1 van Member4");
INSERT INTO tmp_ids (name, value) VALUES ("p1_m4", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m4"), "Project2 van Member4");
INSERT INTO tmp_ids (name, value) VALUES ("p2_m4", (SELECT last_insert_rowid()));
INSERT INTO projects (userId, name) VALUES ((SELECT value FROM tmp_ids WHERE name = "m4"), "Project3 van Member4");
INSERT INTO tmp_ids (name, value) VALUES ("p3_m4", (SELECT last_insert_rowid()));

-- Add (additional) members to projects
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), (SELECT value FROM tmp_ids WHERE name = "m9"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), (SELECT value FROM tmp_ids WHERE name = "m9"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), (SELECT value FROM tmp_ids WHERE name = "m9"));

INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), (SELECT value FROM tmp_ids WHERE name = "m9"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), (SELECT value FROM tmp_ids WHERE name = "m9"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), (SELECT value FROM tmp_ids WHERE name = "m9"));

INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), (SELECT value FROM tmp_ids WHERE name = "m9"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), (SELECT value FROM tmp_ids WHERE name = "m9"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), (SELECT value FROM tmp_ids WHERE name = "m9"));

INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), (SELECT value FROM tmp_ids WHERE name = "m9"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), (SELECT value FROM tmp_ids WHERE name = "m9"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m1"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m2"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m3"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m4"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m5"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m6"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m7"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m8"));
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), (SELECT value FROM tmp_ids WHERE name = "m9"));

-- Add first user to all projects
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m1"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m1"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m1"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m2"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m2"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m2"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m3"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m3"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m3"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p1_m4"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p2_m4"), 1);
INSERT INTO members (projectId, userId) VALUES ((SELECT value FROM tmp_ids WHERE name = "p3_m4"), 1);


DROP TABLE tmp_ids;
