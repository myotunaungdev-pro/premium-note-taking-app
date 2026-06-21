import mongoose from 'mongoose';

export const ALLOWED_TAGS = [
    'Work',
    'Personal',
    'Shopping',
    'Health',
    'Ideas',
    'Finance',
    'Lyrics',
];

// Define the Schema for Notes
const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    titleFontFamily: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    tag: {
        type: String,
        default: 'Work',
        validate: {
            validator(value) {
                return value === '' || ALLOWED_TAGS.includes(value);
            },
            message: '{VALUE} is not a supported tag',
        },
    },
    tagColor: {
        type: String,
        default: '#ffffff'
    },
    isDone: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    // Automatically creates 'createdAt' and 'updatedAt' fields
    timestamps: true
});

// Create and export the Model
const Note = mongoose.model('Note', noteSchema);
export default Note;