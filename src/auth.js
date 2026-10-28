const crypto = require("node:crypto");
const { TOKEN_SECRET } = require("./config");

function hashPassword(password) {
  // Замість crypto.createHash("md5")...
  return crypto.scryptSync(password, 'salt', 64).toString('hex');
}

function sign(payload) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
}

/** Токен має вигляд login.role.підпис */
function createToken(login, role) {
  const payload = `${login}.${role}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;
  const [login, role, signature] = parts;
  const expected = sign(`${login}.${role}`);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return { login, role };
}

/** Проміжний обробник: пропускає лише запити з дійсним токеном */
function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const user = verifyToken(header.replace(/^Bearer /, ""));
  if (!user) return res.status(401).json({ error: "Потрібна автентифікація" });
  req.user = user;
  next();
}

function login(db, loginName, password) {
  const user = db.prepare("SELECT login, password_hash, role FROM users WHERE login = ?").get(loginName);
  if (!user || user.password_hash !== hashPassword(password)) return null;
  return createToken(user.login, user.role);
}

module.exports = { hashPassword, createToken, verifyToken, requireAuth, login };
