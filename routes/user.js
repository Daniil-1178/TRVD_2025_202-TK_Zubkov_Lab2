const express = require('express');

const isAuth = require('../middleware/isAuth');

const userController = require('../controllers/userController'); 

const router = express.Router();

// -------------------------------------------------------------------------
// МАРШРУТИ АВТЕНТИФІКАЦІЇ ТА КОРИСТУВАЧІВ
// -------------------------------------------------------------------------

router.get('/register', userController.redirectIfLoggedIn, userController.getRegister);

router.post('/register', userController.postRegister);

router.get('/login', userController.redirectIfLoggedIn, userController.getLogin);

router.post('/login', userController.postLogin);

router.post('/logout', userController.postLogout);

router.get('/users', isAuth, userController.getUsers);

module.exports = router;
