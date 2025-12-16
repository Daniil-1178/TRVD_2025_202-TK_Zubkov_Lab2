const User = require('../models/user'); 
const bcrypt = require('bcryptjs'); 
const mongoose = require('mongoose');

// --------------------------------------------------------------------------
// Допоміжна функція для редиректу (ЕКСПОРТ ЯК MIDDLEWARE)
// --------------------------------------------------------------------------
exports.redirectIfLoggedIn = (req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/notes'); 
    }
    next();
};


// --------------------------------------------------------------------------
// 1. GET /register - Форма реєстрації 
// --------------------------------------------------------------------------
exports.getRegister = (req, res, next) => {
    res.render('register', {
        pageTitle: 'Реєстрація',
        errorMessage: null,
        username: '',
        email: ''
    });
};

// --------------------------------------------------------------------------
// 2. POST /register - Обробка реєстрації
// --------------------------------------------------------------------------
exports.postRegister = async (req, res, next) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password || password.length < 6) {
        return res.render('register', {
            pageTitle: 'Реєстрація',
            errorMessage: 'Будь ласка, заповніть усі поля. Пароль має бути не менше 6 символів.',
            username: username,
            email: email
        });
    }

    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.render('register', {
                pageTitle: 'Реєстрація',
                errorMessage: 'Користувач з таким email вже зареєстрований.',
                username: username,
                email: email
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12); 

        const user = new User({
            username: username,
            email: email,
            password: hashedPassword
        });

        await user.save();
        
        req.session.isLoggedIn = true;
        req.session.userId = user._id.toString();
        
        req.session.save(err => {
            if (err) console.error('Помилка збереження сесії при реєстрації:', err);
            console.log('Користувач успішно зареєстрований та увійшов:', user.email);
            res.redirect('/notes'); 
        });

    } catch (err) {
        console.error('Помилка реєстрації:', err);
        return res.render('register', {
            pageTitle: 'Реєстрація',
            errorMessage: 'Помилка сервера. Спробуйте пізніше.',
            username: username,
            email: email
        });
    }
};

// --------------------------------------------------------------------------
// 3. GET /login - Форма входу
// --------------------------------------------------------------------------
exports.getLogin = (req, res, next) => {
    res.render('login', {
        pageTitle: 'Вхід',
        errorMessage: null,
        email: ''
    });
};

// --------------------------------------------------------------------------
// 4. POST /login - Обробка входу
// --------------------------------------------------------------------------
exports.postLogin = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', {
            pageTitle: 'Вхід',
            errorMessage: 'Будь ласка, введіть email та пароль.',
            email: email
        });
    }

    try {
        const user = await User.findOne({ email: email });
        
        if (!user) {
            return res.render('login', {
                pageTitle: 'Вхід',
                errorMessage: 'Неправильний email або пароль.',
                email: email
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.render('login', {
                pageTitle: 'Вхід',
                errorMessage: 'Неправильний email або пароль.',
                email: email
            });
        }

        req.session.isLoggedIn = true;
        req.session.userId = user._id.toString();
        
        req.session.save(err => {
            if (err) console.error('Помилка збереження сесії після входу:', err);
            console.log('Користувач успішно увійшов:', user.email);
            res.redirect('/notes'); 
        });

    } catch (err) {
        console.error('Помилка входу:', err);
        return res.render('login', {
            pageTitle: 'Вхід',
            errorMessage: 'Помилка сервера при вході.',
            email: email
        });
    }
};

// --------------------------------------------------------------------------
// 5. POST /logout - Вихід
// --------------------------------------------------------------------------
exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Помилка при виході:', err);
        }
        res.redirect('/'); 
    });
};

// --------------------------------------------------------------------------
// 6. GET /users - Список усіх користувачів
// --------------------------------------------------------------------------
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password'); 

        res.render('users', {
            pageTitle: 'Список користувачів',
            users: users.map(user => ({
                ...user._doc,
                createdAt: user.createdAt.toLocaleDateString('uk-UA')
            })),
            hasUsers: users.length > 0
        });
    } catch (err) {
        console.error('Помилка отримання списку користувачів:', err);
        res.render('users', { pageTitle: 'Список користувачів', errorMessage: 'Помилка завантаження даних.' });
    }
};
