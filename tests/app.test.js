const request = require("supertest");
const { createApp } = require("../src/app");
const { createDb } = require("../src/db");
const data = require("../fixtures/seed.json");

let app;
beforeEach(() => {
  app = createApp(createDb(data));
});

test("вхід із правильним паролем повертає токен", async () => {
  const res = await request(app).post("/api/login").send({ login: "teacher", password: "teacher-pass" });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
});

test("вхід із неправильним паролем повертає 401", async () => {
  const res = await request(app).post("/api/login").send({ login: "teacher", password: "wrong" });
  expect(res.status).toBe(401);
});

test("пошук за частиною імені знаходить студентку", async () => {
  const res = await request(app).get("/api/students/search").query({ name: "Бондар" });
  expect(res.body.map((s) => s.id)).toEqual([2]);
});

test("некоректний ідентифікатор повертає 400", async () => {
  const res = await request(app).get("/api/students/abc/average");
  expect(res.status).toBe(400);
});
