const { DatabaseSync } = require("node:sqlite");
const { hashPassword } = require("./auth");

/**
 * Створює базу даних у пам’яті та заповнює її даними з фікстури.
 * @param {{students: object[], grades: object[], users: object[]}} data
 */
function createDb(data) {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL, group_name TEXT NOT NULL);
    CREATE TABLE grades (student_id INTEGER NOT NULL, value INTEGER NOT NULL);
    CREATE TABLE users (login TEXT PRIMARY KEY, password_hash TEXT NOT NULL, role TEXT NOT NULL);
  `);
  const addStudent = db.prepare("INSERT INTO students (id, name, group_name) VALUES (?, ?, ?)");
  for (const s of data.students) addStudent.run(s.id, s.name, s.group);
  const addGrade = db.prepare("INSERT INTO grades (student_id, value) VALUES (?, ?)");
  for (const g of data.grades) addGrade.run(g.studentId, g.value);
  const addUser = db.prepare("INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)");
  for (const u of data.users) addUser.run(u.login, hashPassword(u.password), u.role);
  return db;
}

module.exports = { createDb };
