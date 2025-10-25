const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./school.db');

// Criação de tabelas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        birthdate TEXT,
        role TEXT,
        course TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course TEXT,
        subject TEXT,
        questions TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS exam_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER,
        student_id INTEGER,
        answers TEXT,
        score REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment TEXT,
        like_count INTEGER DEFAULT 0,
        dislike_count INTEGER DEFAULT 0
    )`);
});

module.exports = db;
