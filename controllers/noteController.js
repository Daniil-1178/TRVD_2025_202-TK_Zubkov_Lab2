const Note = require('../models/note'); 
const User = require('../models/user'); 
const mongoose = require('mongoose');

// --------------------------------------------------------------------------
// 1. GET /notes/ - Відображення списку нотаток
// --------------------------------------------------------------------------
exports.getNotesList = async (req, res, next) => {
    const userId = req.user._id;

    try {
        const notes = await Note.find({ userId: userId })
            .sort({ updatedAt: -1 }); 

        res.render('list', {
            pageTitle: 'Мої нотатки',
            notes: notes.map(note => ({
                ...note._doc,
                createdAt: note.createdAt.toLocaleDateString('uk-UA'),
                updatedAt: note.updatedAt.toLocaleDateString('uk-UA') 
            })),
            hasNotes: notes.length > 0
        });
    } catch (err) {
        console.error('Помилка отримання списку нотаток:', err);
        res.render('list', { pageTitle: 'Мої нотатки', errorMessage: 'Помилка завантаження нотаток.' }); 
    }
};

// --------------------------------------------------------------------------
// 2. GET /notes/create - Відображення форми створення
// --------------------------------------------------------------------------
exports.getCreateNote = (req, res, next) => {
    res.render('create', {
        pageTitle: 'Створити нотатку',
        errorMessage: null,
        editing: false
    });
};

// --------------------------------------------------------------------------
// 3. POST /notes/create - Обробка та збереження нової нотатки
// --------------------------------------------------------------------------
exports.postCreateNote = async (req, res, next) => {
    const { title, content } = req.body;
    
    if (!title || !content || title.trim().length === 0 || content.trim().length === 0) {
        return res.render('create', {
            pageTitle: 'Створити нотатку',
            errorMessage: 'Будь ласка, заповніть усі поля.',
            title: title, 
            content: content,
            editing: false
        });
    }

    const newNote = new Note({
        title: title.trim(),
        content: content.trim(),
        userId: req.user._id 
    });

    try {
        await newNote.save();
        res.redirect('/notes'); 
    } catch (err) {
        console.error('Помилка при збереженні нотатки:', err);
        res.render('create', {
            pageTitle: 'Створити нотатку',
            errorMessage: 'Помилка сервера. Спробуйте пізніше.',
            title: title, 
            content: content,
            editing: false
        });
    }
};

// --------------------------------------------------------------------------
// 4. GET /notes/edit/:noteId - Відображення форми редагування
// --------------------------------------------------------------------------
exports.getEditNote = async (req, res, next) => {
    const noteId = req.params.noteId;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.redirect('/notes'); 
    }

    try {
        const note = await Note.findOne({ 
            _id: noteId, 
            userId: req.user._id 
        });

        if (!note) {
            return res.redirect('/notes');
        }

        res.render('create', {
            pageTitle: 'Редагувати нотатку',
            editing: true,
            noteId: note._id,
            title: note.title,
            content: note.content,
            errorMessage: null
        });
    } catch (err) {
        console.error('Помилка отримання нотатки для редагування:', err);
        res.redirect('/notes');
    }
};

// --------------------------------------------------------------------------
// 5. POST /notes/edit - Обробка форми та оновлення нотатки
// --------------------------------------------------------------------------
exports.postEditNote = async (req, res, next) => {
    const { noteId, title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(noteId) || !title || !content) {
        return res.redirect('/notes');
    }

    try {
        const updatedNote = await Note.findOneAndUpdate(
            { _id: noteId, userId: req.user._id },
            { title: title.trim(), content: content.trim() },
            { new: true }
        );

        if (!updatedNote) {
            return res.redirect('/notes');
        }

        res.redirect('/notes');
    } catch (err) {
        console.error('Помилка при оновленні нотатки:', err);
        res.redirect(`/notes/edit/${noteId}`);
    }
};

// --------------------------------------------------------------------------
// 6. POST /notes/delete/:noteId - Видалення нотатки
// --------------------------------------------------------------------------
exports.postDeleteNote = async (req, res, next) => {
    const noteId = req.params.noteId;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return res.redirect('/notes'); 
    }

    try {
        const result = await Note.deleteOne({ 
            _id: noteId, 
            userId: req.user._id 
        });

        if (result.deletedCount === 0) {
            console.log(`Спроба видалити нотатку ID: ${noteId}, яка не належить користувачу.`);
        } else {
            console.log(`Нотатка ID: ${noteId} успішно видалена.`);
        }

        res.redirect('/notes');
    } catch (err) {
        console.error('Помилка при видаленні нотатки:', err);
        res.redirect('/notes');
    }
};
