const express = require('express');
const mongoose = require('mongoose');
const mustacheExpress = require('mustache-express');
const path = require('path');
const session = require('express-session'); 
const MongoDBStore = require('connect-mongodb-session')(session); 
require('dotenv').config(); 

// ----------------------------------------------------
// ПІДКЛЮЧЕННЯ МАРШРУТІВ ТА МОДЕЛЕЙ
// ----------------------------------------------------
const userRoutes = require('./routes/user');
const noteRoutes = require('./routes/note');
const User = require('./models/user'); 

const app = express();

// ----------------------------------------------------
// 1. НАЛАШТУВАННЯ MUSTACHE
// ----------------------------------------------------
app.engine('mustache', mustacheExpress(
    path.join(__dirname, 'views/partials'),
    '.mustache'
));
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));

// ----------------------------------------------------
// 2. MIDDLEWARE ДЛЯ ОБРОБКИ ТІЛА ЗАПИТУ ТА СТАТИЧНИХ ФАЙЛІВ
// ----------------------------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// ----------------------------------------------------
// 3. НАЛАШТУВАННЯ СХОВИЩА СЕСІЙ (MONGODB)
// ----------------------------------------------------
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI, 
    collection: 'sessions'
});

store.on('error', function(error) {
    console.error('Помилка сховища сесій:', error);
});

// ----------------------------------------------------
// 4. НАЛАШТУВАННЯ MIDDLEWARE СЕСІЙ
// ----------------------------------------------------
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'fallback-secret-key-please-change-me', 
        resave: false, 
        saveUninitialized: false, 
        store: store, 
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// ----------------------------------------------------
// 5. ГЛОБАЛЬНИЙ MIDDLEWARE ДЛЯ АВТОМАТИЧНОЇ ПЕРЕДАЧІ ДАНИХ СЕСІЇ ТА КОРИСТУВАЧА
// ----------------------------------------------------
app.use(async (req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn || false; 

    if (!req.session.userId) {
        return next();
    }

    try {
        const user = await User.findById(req.session.userId);
        
        if (user) {
            req.user = user;
            res.locals.userId = user._id;
        }
        next();
    } catch (err) {
        console.error('Помилка пошуку користувача у сесії:', err);
        next();
    }
});

// ----------------------------------------------------
// 6. ПІДКЛЮЧЕННЯ МАРШРУТІВ
// ----------------------------------------------------
app.use(userRoutes);
app.use('/notes', noteRoutes);

app.get('/', (req, res) => {
    res.render('index', { pageTitle: 'Головна сторінка' });
});

app.use((req, res) => {
    res.status(404).render('404', { pageTitle: 'Сторінка не знайдена' });
});

// ----------------------------------------------------
// 7. ПІДКЛЮЧЕННЯ ДО БАЗИ ДАНИХ ТА ЗАПУСК СЕРВЕРА
// ----------------------------------------------------
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB успішно підключено.');
        app.listen(3000, () => {
            console.log('Сервер запущено на http://localhost:3000');
        });
    })
    .catch(err => {
        console.error('Помилка підключення до MongoDB:', err);
    });
