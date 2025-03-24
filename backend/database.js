const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
	if (err) {
		console.error('Error connecting to SQLite database:', err.message);
	} else {
		console.log('Connected to SQLite database');
	}
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

module.exports = db;

db.serialize(() => {
	// Create 'users' table
	db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            user_token TEXT UNIQUE,
            token_expiration DATETIME
        )
    `);

	// Create 'questions' table with the 'paper' field added
	db.run(`
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year_of_paper TEXT NOT NULL,
            subject TEXT NOT NULL,  -- Added subject (e.g., 'Physics', 'Math')
            topic TEXT NOT NULL,    -- Added topic (e.g., 'SHM', 'Integration')
            paper TEXT NOT NULL,    -- Added paper (e.g., 'Paper 2', 'Paper 3')
            question_number INTEGER NOT NULL,
            question BLOB NOT NULL,
            points_available INTEGER NOT NULL DEFAULT 0,
            time_available INTEGER NOT NULL DEFAULT 0
        )
    `);

	// Create 'user_questions' table
	db.run(`
        CREATE TABLE IF NOT EXISTS user_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            time_taken INTEGER NOT NULL,
            marks_scored INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
    `);
});

console.log('Database initialized');
