const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: [
                "QUEUED",
                "ACTIVE",
                "COMPLETED",
                "FAILED",
                "DEAD"
            ],
            default: "QUEUED"
        },

        priority: {
            type: String,
            default: "MEDIUM"
        },
        progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
        },
        schedule: {
            type: String,
            default: null
        },

        payload: {
            type: mongoose.Schema.Types.Mixed
        },

        attemptsMade: {
            type: Number,
            default: 0
        },

        error: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Job", jobSchema);