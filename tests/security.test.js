const request = require('supertest');
const { createApp } = require('../src/app');
const { createDb } = require('../src/db');
const data = require('../fixtures/seed.json');

let app;

beforeEach(() => {
  // Создаем свежую базу данных перед каждым тестом
  app = createApp(createDb(data));
});

describe('Security Tests', () => {
  it('SQL-ін\'єкція: не повинно дозволяти ін\'єкції в ID', async () => {
    // Вводим инъекцию в поиск
    const res = await request(app).get("/api/students/search").query({ name: "%' OR 1=1 --" });
    // Тест упадет, так как код уязвим и вернет всех студентов (статус 200 и много записей)
    expect(res.body.length).toBe(0); 
  });

  it('Витік стеку: обробник помилок не повинен повертати stack trace', async () => {
    const res = await request(app).get('/api/invalid-route');
    // Уязвим, если в ответе есть слово "stack"
    expect(res.text).not.toContain('stack');
  });

  it('Відсутність ролі: забороняє DELETE для ролі student', async () => {
    // Получаем токен студента
    const loginRes = await request(app).post('/api/login').send({ login: 'student', password: 'student-pass' });
    const token = loginRes.body.token;

    // Пытаемся удалить запись
    const delRes = await request(app)
      .delete('/api/students/1')
      .set('Authorization', `Bearer ${token}`);
    
    // Должно вернуть 403 Forbidden, но вернет 204 OK (тест упадет)
    expect(delRes.status).toBe(403);
  });
});