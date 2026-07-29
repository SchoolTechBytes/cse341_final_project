import mongoose from "mongoose";

const ticketHistorySchema = new Schema(
    {
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ticket',
            required: true
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        fieldChanged: {
            type: String,
            required: true
        },
        oldValue: {
            type: String
        },
        newValue: {
            type: String
        }
    },
    {
        timestamps: { createdAt: 'changedAt', updatedAt: false }
    });

ticketHistorySchema.index({ ticketId: 1 });

export default mongoose.model('TicketHistory', ticketHistorySchema);