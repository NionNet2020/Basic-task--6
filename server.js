const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// Настройка базы данных
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/database.sqlite'
});

// Модель пользователя
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true },
  passwordHash: DataTypes.STRING
});

// Инициализация БД
(async () => {
  await sequelize.sync();
})();

// Сессии
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Middleware для проверки авторизации
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  next();
};

// Роуты
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash: hashedPassword });
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  
  if (user && await bcrypt.compare(password, user.passwordHash)) {
    req.session.userId = user.id;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/profile', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/data', requireAuth, (req, res) => {
  const cacheFile = path.join(__dirname, 'cache', 'data.json');
  
  fs.readFile(cacheFile, (err, data) => {
    if (!err && Date.now() - JSON.parse(data).timestamp < 60000) {
      return res.json(JSON.parse(data));
    }

    // Генерация новых данных
    const newData = {
      timestamp: Date.now(),
      data: `Current time: ${new Date().toISOString()}`
    };
    
    fs.writeFile(cacheFile, JSON.stringify(newData), (err) => {
      if (err) console.error(err);
      res.json(newData);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!fs.existsSync('./cache')) {
    fs.mkdirSync('./cache');
  }
});