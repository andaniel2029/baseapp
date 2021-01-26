const mongoose = require('mongoose')
const slugify = require('slugify')

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name can not be more than 50 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description can not be more than 500 characters'],
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
    groupGames: [
      {
        game: { type: mongoose.Schema.ObjectId, ref: 'Game' },
      },
    ],
    photo: {
      type: String,
      default: 'no-photo.jpg',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

GroupSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true })
  next()
})

// Cascade delete games
GroupSchema.pre('remove', async function (next) {
  console.log(`Games being removed from group ${this._id}`)
  await this.model('Game').deleteMany({ group: this._id })
  next()
})

module.exports = mongoose.model('Group', GroupSchema)
