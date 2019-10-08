const mongoose = require("mongoose");
const ReplySchema = require('./replySchema.js');

module.exports = mongoose.model('reply', ReplySchema);