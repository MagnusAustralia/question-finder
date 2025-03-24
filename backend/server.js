const express = require('express');
const multer = require('multer');
const db = require('./database');
const app = express();

const cors = require('cors');
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json({ limit: '10mb' }));

// Configure multer for image uploads (stores in memory as a buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/** 🟢 Get all users */
app.get('/users', (req, res) => {
	db.all('SELECT * FROM users', [], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

/** 🟢 Get all questions */
app.get('/questions', (req, res) => {
	db.all('SELECT * FROM questions', [], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

/** 🟢 Get filtered random questions */
app.get('/random-questions', (req, res) => {
	const { year, subject, topic, min_points, limit } = req.query;

	const sql = `
        SELECT * FROM questions 
        WHERE 
            (year_of_paper = ? OR ? IS NULL) 
            AND (subject = ? OR ? IS NULL) 
            AND (topic = ? OR ? IS NULL) 
            AND (points_available >= ? OR ? IS NULL) 
        ORDER BY RANDOM() 
        LIMIT ?;
    `;

	db.all(
		sql,
		[
			year || null,
			year || null,
			subject || null,
			subject || null,
			topic || null,
			topic || null,
			min_points || 0,
			min_points || 0,
			limit || 10
		],
		(err, rows) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json(rows);
		}
	);
});

/** 🟢 Insert a new question (with base64 image support) */
app.post('/add-question', (req, res) => {
	const {
		year_of_paper,
		subject,
		topic,
		paper,
		points_available,
		time_available,
		question_number,
		question_image // base64 image string
	} = req.body;

	// Check if the required fields are provided
	if (
		!year_of_paper ||
		!subject ||
		!topic ||
		!paper ||
		points_available == null ||
		time_available == null ||
		question_number == null ||
		!question_image
	) {
		return res.status(400).json({ error: 'Missing required fields or image' });
	}

	// Validate the image format (should be a base64 string starting with "data:image")
	if (!question_image.startsWith('data:image/')) {
		return res.status(400).json({ error: 'Invalid image format' });
	}

	// Extract the image type (JPEG, PNG, etc.)
	const imageTypeMatch = question_image.match(/^data:image\/([a-zA-Z]*);base64,/);
	if (!imageTypeMatch) {
		return res.status(400).json({ error: 'Unable to extract image type' });
	}
	const imageType = imageTypeMatch[1]; // Extracts the image type (e.g., "jpeg", "png")

	// Ensure that the image type is either JPEG or PNG (you can add more types as needed)
	if (!['jpeg', 'png'].includes(imageType)) {
		return res.status(400).json({ error: `Unsupported image type: ${imageType}` });
	}

	// Convert the image from base64 to a binary buffer
	const imageBuffer = Buffer.from(question_image.replace(/^data:image\/\w+;base64,/, ''), 'base64');

	// Insert the question into the database, including the question_number
	const sql = `
      INSERT INTO questions (year_of_paper, subject, topic, paper, question, points_available, time_available, question_number) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

	db.run(
		sql,
		[
			year_of_paper,
			subject,
			topic,
			paper,
			imageBuffer,
			points_available,
			time_available,
			question_number
		],
		function (err) {
			if (err) {
				return res.status(500).json({ error: err.message });
			}
			res.json({ message: 'Question added successfully', id: this.lastID });
		}
	);
});

app.post('/bulk-upload-questions', (req, res) => {
	const questions = req.body; // An array of questions to be uploaded

	// Validate if the required fields exist in each question
	if (!Array.isArray(questions) || questions.length === 0) {
		console.error('Invalid data format, expected an array of questions.');
		return res.status(400).json({ error: 'Invalid data format, expected an array of questions.' });
	}

	// Log the questions data to inspect what’s coming through
	// console.log('Received Questions:', JSON.stringify(questions, null, 2));

	const insertSQL = `
	  INSERT INTO questions (year_of_paper, subject, topic, paper, question, points_available, time_available, question_number) 
	  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`;

	db.serialize(() => {
		// Start a transaction
		db.run('BEGIN TRANSACTION');

		let errorOccurred = false; // Flag to track if any error occurs during the loop

		questions.forEach((question, index) => {
			const {
				year_of_paper,
				subject,
				topic,
				paper,
				question_image, // base64 image string
				points_available,
				time_available,
				question_number // the new field
			} = question;

			// Log question fields for debugging
			// console.log(`Processing Question ${index + 1}:`, question);

			// Validate that each required field is present
			if (
				!year_of_paper ||
				!subject ||
				!topic ||
				!paper ||
				!question_image ||
				points_available == null ||
				time_available == null ||
				question_number == null // Check that question_number is also provided
			) {
				console.error(`Missing required fields in question ${index + 1}`);
				errorOccurred = true; // Set the flag if any error is found
				return; // Skip the current iteration
			}

			// Validate the image format (should be a base64 string starting with "data:image")
			if (!question_image.startsWith('data:image/')) {
				console.error(`Invalid image format in question ${index + 1}`);
				errorOccurred = true;
				return; // Skip the current iteration
			}

			// Extract the image type (JPEG, PNG, etc.)
			const imageTypeMatch = question_image.match(/^data:image\/([a-zA-Z]*);base64,/);
			if (!imageTypeMatch) {
				console.error(`Unable to extract image type from question ${index + 1}`);
				errorOccurred = true;
				return; // Skip the current iteration
			}
			const imageType = imageTypeMatch[1]; // Extracts the image type (e.g., "jpeg", "png")

			// Ensure that the image type is either JPEG or PNG (you can add more types as needed)
			if (!['jpeg', 'png'].includes(imageType)) {
				console.error(`Unsupported image type in question ${index + 1}: ${imageType}`);
				errorOccurred = true;
				return; // Skip the current iteration
			}

			// Convert the image from base64 to a binary buffer
			const imageBuffer = Buffer.from(
				question_image.replace(/^data:image\/\w+;base64,/, ''),
				'base64'
			);

			// Run the insert query for each question
			db.run(
				insertSQL,
				[
					year_of_paper,
					subject,
					topic,
					paper,
					imageBuffer,
					points_available,
					time_available,
					question_number
				],
				function (err) {
					if (err) {
						// If an error occurs, roll back the transaction
						console.error(`Error inserting question ${index + 1}:`, err.message);
						db.run('ROLLBACK');
						errorOccurred = true; // Set the flag
						return; // Skip the current iteration
					}
				}
			);
		});

		// If any error occurred during the loop, return an error response
		if (errorOccurred) {
			return res.status(400).json({ error: 'One or more questions have invalid data or images.' });
		}

		// If everything went fine, commit the transaction
		db.run('COMMIT', (err) => {
			if (err) {
				console.error('Transaction commit failed:', err.message);
				return res.status(500).json({ error: 'Transaction failed: ' + err.message });
			}
			console.log('Bulk upload successful!');
			res.json({ message: 'Bulk upload successful!' });
		});
	});
});

/** 🟢 Retrieve question images (returns as base64) */
app.get('/question/:id/image', (req, res) => {
	const questionId = req.params.id;

	db.get('SELECT question FROM questions WHERE id = ?', [questionId], (err, row) => {
		if (err) return res.status(500).json({ error: err.message });
		if (!row || !row.question) return res.status(404).json({ error: 'Image not found' });

		// Ensure you only prepend once
		const base64Image = row.question.toString('base64');
		res.json({ image: `data:image/jpeg;base64,${base64Image}` });
	});
});

/** 🟢 Mark a question as completed */
app.post('/complete-question', (req, res) => {
	const { user_id, question_id, time_taken, marks_scored } = req.body;

	if (!user_id || !question_id || time_taken == null || marks_scored == null) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	const sql = `INSERT INTO user_questions (user_id, question_id, time_taken, marks_scored) VALUES (?, ?, ?, ?)`;
	db.run(sql, [user_id, question_id, time_taken, marks_scored], function (err) {
		if (err) return res.status(500).json({ error: err.message });
		res.json({ message: 'Question completed', id: this.lastID });
	});
});

/** 🟢 Get completed questions for a user */
app.get('/user/:id/completed-questions', (req, res) => {
	const userId = req.params.id;

	const sql = `
        SELECT q.id, q.year_of_paper, q.subject, q.topic, q.points_available, q.time_available, 
               uq.completed_at, uq.time_taken, uq.marks_scored 
        FROM user_questions uq
        JOIN questions q ON uq.question_id = q.id
        WHERE uq.user_id = ?
    `;

	db.all(sql, [userId], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
