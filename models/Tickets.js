import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['new', 'in_progress', 'rejected', 'closed'],
            required: true,
            default: 'new',
            index: true
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            required: true,
            default: 'medium'
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        closedAt: {
            type: Date,
            default: null
        },
    },
    {
        timestamps: true // Automatically manages createdAt and updatedAt fields
    }
);

// Compound index for filtered list queries (status + priority)
ticketSchema.index({ status: 1, priority: 1 });

export default mongoose.model('Ticket', ticketSchema);