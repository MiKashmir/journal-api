const express = require("express");
const students = require("./students");
const { requireAuth, login } = require("./auth");

/** Перевіряє, що :id — додатне ціле число */
function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Некоректний ідентифікатор" });
  }
  req.studentId = id;
  next();
}

function createApp(db) {
  const app = express();
  app.use(express.json());

  app.post("/api/login", (req, res) => {
    const token = login(db, req.body.login, req.body.password);
    if (!token) return res.status(401).json({ error: "Невірний логін або пароль" });
    res.json({ token });
  });

  app.get("/api/students", (req, res) => {
    const page = Number(req.query.page) || 1;
    res.json(students.listStudents(db, page));
  });

  app.get("/api/students/search", (req, res) => {
    res.json(students.findByName(db, req.query.name || ""));
  });

  app.get("/api/students/:id/average", validateId, (req, res) => {
    if (!students.getById(db, req.studentId)) return res.status(404).json({ error: "Студента не знайдено" });
    res.json({ average: students.averageGrade(db, req.studentId) });
  });

  app.get("/api/students/:id/card", validateId, (req, res) => {
    const s = students.getById(db, req.studentId);
    if (!s) return res.status(404).send("Студента не знайдено");
    const avg = students.averageGrade(db, req.studentId);
    res.type("html").send(`<h1>${s.name}</h1><p>Група: ${s.group_name}</p><p>Середній бал: ${avg}</p>`);
  });

  app.delete("/api/students/:id", requireAuth, validateId, (req, res) => {
    // Додана перевірка ролі:
    if (req.user.role !== 'teacher') return res.status(403).json({ error: "Недостатньо прав" });
    
    if (!students.deleteStudent(db, req.studentId)) return res.status(404).json({ error: "Студента не знайдено" });
    res.status(204).end();
  });

  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message, stack: err.stack });
  });

  return app;
}

module.exports = { createApp };
