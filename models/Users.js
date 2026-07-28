import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    passwordHash: {
        type: String,
        default: null
    },
    authProvider: {
        type: String,
        enum: ['local', 'github'],
        required: true,
        default: 'local'
    },
    providerId: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['customer', 'support', 'manager', 'admin'],
        required: true,
        default: 'customer'
    },
    lastAssignedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});

export default mongoose.model('User', userSchema);