const express = require('express');

const isAuth = require('../middleware/isAuth');

const noteController = require('../controllers/noteController');

const router = express.Router();

// -------------------------------------------------------------------------
// МАРШРУТИ CRUD ДЛЯ НОТАТОК
// -------------------------------------------------------------------------

router.get('/', isAuth, noteController.getNotesList); 

router.get('/create', isAuth, noteController.getCreateNote);

router.post('/create', isAuth, noteController.postCreateNote);

// -------------------------------------------------------------------------
// Маршрути для редагування та видалення
// -------------------------------------------------------------------------

router.get('/edit/:noteId', isAuth, noteController.getEditNote);

router.post('/edit', isAuth, noteController.postEditNote);

router.post('/delete/:noteId', isAuth, noteController.postDeleteNote);

module.exports = router;
