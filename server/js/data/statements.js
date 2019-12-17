// Class: Statement defines SQL statements
class Statement {
	constructor(db, sqlStatement) {
		const self = this;

		self._db = db;
		self._statement = db.prepare(sqlStatement);
	}
	execute(/* params, resultClass */) {
		throw new Error("Subclass should implement the execute method");
	}
}

class SingleCreateStatement extends Statement {
	constructor(db, sqlStatement) {
		super(db, sqlStatement);
	}
	execute(params, resultClass) {
		const self = this;

		try {
			let id;
			self._db.transaction(function(statement) {
				let info = statement.run(params);
				if(info.changes !== 1) {
					throw new Error("Create statement did not result in single row");
				}
				if(!Number.isInteger(info.lastInsertRowid)) {
					throw new Error("Create statement did not result in integer id");
				}
				id = info.lastInsertRowid;
			})(self._statement);
			return resultClass.fromData({ id: id });
		} catch(e) {
			console.error("Failed to add element to db:", e);
			return resultClass.fromSQLException(e, resultClass.invalidData);
		}
	}
}

class SingleCreateOrUpdateStatement extends Statement {
	constructor(db, sqlStatement) {
		super(db, sqlStatement);
	}
	execute(params, resultClass) {
		const self = this;

		try {
			let id;
			let modificationTimestamp;
			self._db.transaction(function(statement) {
				let info = statement.run(params);
				if(info.changes !== 1) {
					throw new Error("CreateOrUpdate statement did not result in single row");
				}
				if(params["id"] && Number.isInteger(+params["id"])) {
					id = +params["id"];
				} else {
					if(!Number.isInteger(info.lastInsertRowid)) {
						throw new Error("CreateOrUpdate statement did not result in integer id");
					}
					id = info.lastInsertRowid;
				}
				if(params["_now"]) {
					modificationTimestamp = params["_now"];
				}
			})(self._statement);
			return resultClass.fromData({ id: id, modificationTimestamp: modificationTimestamp });
		} catch(e) {
			console.error("Failed to add/update element to db:", e);
			return resultClass.fromSQLException(e, resultClass.invalidData);
		}
	}
}

class SingleReadStatement extends Statement {
	constructor(db, sqlStatement) {
		super(db, sqlStatement);
	}
	execute(params, resultClass) {
		const self = this;

		try {
			let element = self._statement.get(params);
			if(element === undefined) {
				return resultClass.noResourceFound;
			}
			return resultClass.fromData(element);
		} catch(e) {
			console.error("Failed to retrieve element from db:", e);
			return resultClass.fromSQLException(e, resultClass.invalidData);
		}
	}
}

class MultiReadStatement extends Statement {
	constructor(db, sqlStatement) {
		super(db, sqlStatement);
	}
	execute(params, resultClass) {
		const self = this;

		try {
			return resultClass.fromData(self._statement.all(params));
		} catch(e) {
			console.error("Failed to retrieve selection of elements from db:", e);
			return resultClass.fromSQLException(e, resultClass.invalidData);
		}
	}
}

class SingleUpdateStatement extends Statement {
	constructor(db, sqlStatement) {
		super(db, sqlStatement);
	}
	execute(params, resultClass) {
		const self = this;

		try {
			self._db.transaction(function(statement) {
				let info = statement.run(params);
				if(info.changes !== 1) {
					throw new Error("Update statement did not update a single row");
				}
			})(self._statement);
			if(params["_now"]) {
				return resultClass.fromData({ modificationTimestamp: params["_now"] });
			} else {
				return resultClass.okNoData;
			}
		} catch(e) {
			console.error("Failed to update element in db:", e);
			return resultClass.fromSQLException(e, resultClass.invalidData);
		}
	}
}

class MultiUpdateStatement extends Statement {
	constructor(db, sqlStatement) {
		super(db, sqlStatement);
	}
	execute(params, resultClass) {
		const self = this;

		try {
			// No need to run this within transaction since it is unclear
			// when a successful run resulted in unwanted changes (different
			// from for example a single update resulting in multiple rows
			// being updated).
			self._statement.run(params);
			return resultClass.okNoData;
		} catch(e) {
			console.error("Failed to update element in db:", e);
			return resultClass.fromSQLException(e, resultClass.invalidData);
		}
	}
}

class SingleDeleteStatement extends Statement {
	constructor(db, sqlStatement) {
		super(db, sqlStatement);
	}
	execute(params, resultClass) {
		const self = this;

		try {
			self._db.transaction(function(statement) {
				let info = statement.run(params);
				if(info.changes !== 1) {
					throw new Error("Delete statement did not delete a single row");
				}
			})(self._statement);
			return resultClass.okNoData;
		} catch(e) {
			console.error("Failed to delete element from db:", e);
			return resultClass.fromSQLException(e, resultClass.invalidData);
		}
	}
}

class MultiDeleteStatement extends Statement {
	constructor(db, sqlStatement) {
		super(db, sqlStatement);
	}
	execute(params, resultClass) {
		const self = this;

		try {
			// No need to run this within transaction since it is unclear
			// when a successful run resulted in unwanted changes (different
			// from for example a single delete resulting in multiple rows
			// being deleted).
			self._statement.run(params);
			return resultClass.okNoData;
		} catch(e) {
			console.error("Failed to delete element from db:", e);
			return resultClass.fromSQLException(e, resultClass.invalidData);
		}
	}
}

module.exports = {
	SingleCreateStatement: SingleCreateStatement,
	SingleCreateOrUpdateStatement: SingleCreateOrUpdateStatement,

	SingleReadStatement: SingleReadStatement,
	MultiReadStatement: MultiReadStatement,

	SingleUpdateStatement: SingleUpdateStatement,
	MultiUpdateStatement: MultiUpdateStatement,

	SingleDeleteStatement: SingleDeleteStatement,
	MultiDeleteStatement: MultiDeleteStatement
};
