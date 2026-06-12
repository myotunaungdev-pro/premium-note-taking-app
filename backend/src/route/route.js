import express from 'express';
import {
    getNotes,
    createNote,
    getNoteById,
    updateNote,
    deleteNote,
    // ✨ bulk
    bulkArchiveNotes,
    bulkTrashNotes,
    bulkRestoreNotes
} from '../controller/notesController.js';

const router = express.Router();

// Fetch all notes
router.get('/notes', getNotes);

// Create a new note
router.post('/notes', createNote);

// 🚀 API routes for bulk actions 
router.patch('/notes/bulk-archive', bulkArchiveNotes);
router.patch('/notes/bulk-trash', bulkTrashNotes);
router.patch('/notes/bulk-restore', bulkRestoreNotes);

// Fetch a single note by ID
router.get('/notes/:id', getNoteById);

// Update an existing note by ID
router.put('/notes/:id', updateNote);

// Delete a note by ID
router.delete('/notes/:id', deleteNote);

export default router;