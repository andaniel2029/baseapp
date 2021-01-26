const mongoose = require('mongoose')

const GameSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a game title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: true,
  },
  users: [
    {
      user: { type: mongoose.Schema.ObjectId, ref: 'User' },
      role: {
        type: String,
        required: true,
        enum: ['user', 'moderator', 'creator'],
        default: 'user',
      },
    },
  ],
  requests: [
    {
      user: { type: mongoose.Schema.ObjectId, ref: 'User' },
      message: {
        type: String,
      },
    },
  ],
})

module.exports = mongoose.model('Game', GameSchema)
