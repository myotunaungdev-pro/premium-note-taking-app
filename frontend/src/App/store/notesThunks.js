import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Fetch all notes
export const fetchNotes = createAsyncThunk('notes/fetchNotes', async () => {
    const response = await axios.get(`${API_URL}/notes`);
    return response.data;
});

// Create a new note
export const addNoteToServer = createAsyncThunk('notes/addNote', async (newNote) => {
    const response = await axios.post(`${API_URL}/notes`, newNote);
    return { ...newNote, _id: response.data.id };
});

// Update an existing note
export const updateNoteOnServer = createAsyncThunk('notes/updateNote', async (updatedNote) => {
    await axios.put(`${API_URL}/notes/${updatedNote._id}`, updatedNote);
    return updatedNote;
});

// Permanently delete a note
export const permanentlyDeleteFromServer = createAsyncThunk('notes/deleteNote', async (id) => {
    await axios.delete(`${API_URL}/notes/${id}`);
    return id;
});

// Bulk Archive
export const bulkArchiveOnServer = createAsyncThunk(
    'notes/bulkArchiveOnServer',
    async (ids, { rejectWithValue }) => {
        try {
            await axios.patch(`${API_URL}/notes/bulk-archive`, { ids });
            return ids;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Bulk Trash
export const bulkTrashOnServer = createAsyncThunk(
    'notes/bulkTrashOnServer',
    async (ids, { rejectWithValue }) => {
        try {
            await axios.patch(`${API_URL}/notes/bulk-trash`, { ids });
            return ids;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Bulk Restore
export const bulkRestoreOnServer = createAsyncThunk(
    'notes/bulkRestoreOnServer',
    async (ids, { rejectWithValue }) => {
        try {
            await axios.patch(`${API_URL}/notes/bulk-restore`, { ids });
            return ids;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);