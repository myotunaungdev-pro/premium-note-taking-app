import { createSlice } from '@reduxjs/toolkit';
import {
    fetchNotes,
    addNoteToServer,
    updateNoteOnServer,
    permanentlyDeleteFromServer,
    bulkArchiveOnServer,
    bulkTrashOnServer,
    bulkRestoreOnServer,
} from './notesThunks';

const notesSlice = createSlice({
    name: 'notes',
    initialState: {
        notes: [],
        status: 'idle',
        activeView: 'all',
        searchQuery: '',
        sortBy: 'latest',
        sidebarCollapsed: false,
        editingNote: null,
        isModalOpen: false,
        readingNote: null,
        isReaderOpen: false,
        selectedNoteIds: []
    },
    reducers: {
        setActiveView: (state, action) => { state.activeView = action.payload; },
        setSearchQuery: (state, action) => { state.searchQuery = action.payload; },
        setSortBy: (state, action) => { state.sortBy = action.payload; },
        toggleSidebar: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
        setEditingNote: (state, action) => { state.editingNote = action.payload; },
        setModalOpen: (state, action) => { state.isModalOpen = action.payload; },
        setSidebarCollapsed: (state, action) => { state.sidebarCollapsed = action.payload; },
        setReadingNote: (state, action) => { state.readingNote = action.payload; },
        setReaderOpen: (state, action) => { state.isReaderOpen = action.payload; },
        toggleSelectNote: (state, action) => {
            if (state.selectedNoteIds.includes(action.payload)) {
                state.selectedNoteIds = state.selectedNoteIds.filter(id => id !== action.payload);
            } else {
                state.selectedNoteIds.push(action.payload);
            }
        },
        clearSelection: (state) => { state.selectedNoteIds = []; },
        selectAllNotes: (state, action) => {
            state.selectedNoteIds = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Notes
            .addCase(fetchNotes.fulfilled, (state, action) => {
                state.notes = action.payload;
                state.status = 'succeeded';
            })
            // Add Note
            .addCase(addNoteToServer.fulfilled, (state, action) => {
                state.notes.unshift(action.payload);
            })
            // Update Note
            .addCase(updateNoteOnServer.fulfilled, (state, action) => {
                const index = state.notes.findIndex((n) => n._id === action.payload._id);
                if (index !== -1) {
                    state.notes[index] = action.payload;
                }
            })
            // Delete Note
            .addCase(permanentlyDeleteFromServer.fulfilled, (state, action) => {
                state.notes = state.notes.filter((n) => n._id !== action.payload);
            })
            // Bulk Archive
            .addCase(bulkArchiveOnServer.fulfilled, (state, action) => {
                const ids = action.payload;
                state.notes = state.notes.map((n) =>
                    ids.includes(n._id) ? { ...n, isArchived: true, isDeleted: false } : n
                );
                state.selectedNoteIds = [];
            })
            // Bulk Trash
            .addCase(bulkTrashOnServer.fulfilled, (state, action) => {
                const ids = action.payload;
                state.notes = state.notes.map((n) =>
                    ids.includes(n._id) ? { ...n, isDeleted: true, isArchived: false } : n
                );
                state.selectedNoteIds = [];
            })
            // Bulk Restore
            .addCase(bulkRestoreOnServer.fulfilled, (state, action) => {
                const ids = action.payload;
                state.notes = state.notes.map((n) =>
                    ids.includes(n._id) ? { ...n, isArchived: false, isDeleted: false } : n
                );
                state.selectedNoteIds = [];
            });
    },
});

export const {
    setActiveView,
    setSearchQuery,
    setSortBy,
    toggleSidebar,
    setEditingNote,
    setModalOpen,
    setSidebarCollapsed,
    setReadingNote,
    setReaderOpen,
    toggleSelectNote,
    clearSelection,
    selectAllNotes
} = notesSlice.actions;

export default notesSlice.reducer;