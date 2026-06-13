import Note from '../model/notes.js';

// Get all notes (Excluding soft-deleted ones if needed)
export const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 }); // Sort by latest
        res.status(200).json(notes);
    } catch (err) {
        res.status(500).json({ message: "Error fetching notes", error: err.message });
    }
};

// Get a single note by ID
export const getNoteById = async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        res.status(200).json(note);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving note", error: err.message });
    }
};

// Create a new note
export const createNote = async (req, res) => {
    try {
        // Mongoose automatically filters fields based on schema and sets default values
        const newNote = new Note({
            ...req.body,
            userId: req.user.id // Enforce ownership
        });
        const savedNote = await newNote.save();

        // Return response format matching your frontend slice (_id instead of insertedId)
        res.status(201).json({ message: "Note created", id: savedNote._id });
    } catch (err) {
        res.status(500).json({ message: "Save failed", error: err.message });
    }
};

// Update an existing note
export const updateNote = async (req, res) => {
    try {
        const updatedNote = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: req.body },
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedNote) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        res.status(200).json({ message: "Update successful", updatedNote });
    } catch (err) {
        res.status(500).json({ message: "Update failed", error: err.message });
    }
};

// Delete a note permanently
export const deleteNote = async (req, res) => {
    try {
        const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!deletedNote) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }
        res.status(200).json({ message: "Deleted successful" });
    } catch (err) {
        res.status(500).json({ message: "Delete failed", error: err.message });
    }
};

// 🚀 Archive
export const bulkArchiveNotes = async (req, res) => {
    try {
        const { ids } = req.body; // Array from frontend (example - ["id1", "id2"])
        
        await Note.updateMany(
            { _id: { $in: ids }, userId: req.user.id }, 
            { $set: { isArchived: true, isDeleted: false } }
        );
        
        res.status(200).json({ message: "Successfully archived selected notes" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 🚀 Trash
export const bulkTrashNotes = async (req, res) => {
    try {
        const { ids } = req.body;
        
        await Note.updateMany(
            { _id: { $in: ids }, userId: req.user.id }, 
            { $set: { isDeleted: true, isArchived: false } }
        );
        
        res.status(200).json({ message: "Successfully trashed selected notes" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 🚀 Restore
export const bulkRestoreNotes = async (req, res) => {
    try {
        const { ids } = req.body;
        
        await Note.updateMany(
            { _id: { $in: ids }, userId: req.user.id }, 
            { $set: { isArchived: false, isDeleted: false } }
        );
        
        res.status(200).json({ message: "Successfully restored selected notes" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};