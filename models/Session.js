import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        _id: {
            type: String
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        lastSeenAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        _id: false // Automatically manages createdAt and updatedAt
    });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);