const mongoose = require("mongoose");
const ThreadSchema = require('./threadSchema');

module.exports = mongoose.model('thread', ThreadSchema);