import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosConfig';

// Fetch all notes
export const fetchNotes = createAsyncThunk('notes/fetchNotes', async () => {
    const response = await axiosInstance.get(`/notes`);
    return response.data;
});

// Create a new note
export const addNoteToServer = createAsyncThunk('notes/addNote', async (newNote) => {
    const response = await axiosInstance.post(`/notes`, newNote);
    return { ...newNote, _id: response.data.id };
});

// Update an existing note
export const updateNoteOnServer = createAsyncThunk('notes/updateNote', async (updatedNote) => {
    const response = await axiosInstance.put(`/notes/${updatedNote._id}`, updatedNote);
    return response.data.updatedNote;
});

// Permanently delete a note
export const permanentlyDeleteFromServer = createAsyncThunk('notes/deleteNote', async (id) => {
    await axiosInstance.delete(`/notes/${id}`);
    return id;
});

// Bulk Archive
export const bulkArchiveOnServer = createAsyncThunk(
    'notes/bulkArchiveOnServer',
    async (ids, { rejectWithValue }) => {
        try {
            await axiosInstance.patch(`/notes/bulk-archive`, { ids });
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
            await axiosInstance.patch(`/notes/bulk-trash`, { ids });
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
            await axiosInstance.patch(`/notes/bulk-restore`, { ids });
            return ids;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);