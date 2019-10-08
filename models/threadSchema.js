const mongoose = require("mongoose");
const ReplySchema = require('./replySchema.js');

module.exports = new mongoose.Schema({
  board: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  created_on: {
    type: Date,
    default: ()=>new Date()
  },
  bumped_on: {
    type: Date,
    default: ()=>new Date()
  },
  reported: {
    type: Boolean,
    default: false
  },
  delete_password: {
    type: String,
    required: true
  },
  replies: {
    type: [ReplySchema],
    default: []
  }
});
