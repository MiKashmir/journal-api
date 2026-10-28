const { createApp } = require("./app");
const { createDb } = require("./db");
const { PORT } = require("./config");
const data = require("../fixtures/seed.json");

const app = createApp(createDb(data));
app.listen(PORT, () => console.log(`Журнал запущено: http://localhost:${PORT}`));
