
const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    }
}, { timestamps: true });

// This tells MongoDB to automatically delete the document 24 hours (86400 seconds) after it's created
blacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Blacklist', blacklistSchema);