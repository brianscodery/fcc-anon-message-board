const mongoose = require("mongoose");

module.exports = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  delete_password: {
    type: String,
    required: true
  },
  created_on: {
    type: Date,
    default: ()=>new Date()
  },
  reported: {
    type: Boolean,
    default: false
  }
});

