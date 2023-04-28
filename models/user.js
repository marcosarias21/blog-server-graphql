import mongoose from "mongoose";

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    uniquie: true,
    minlenght: 3,
  },
  password: {
    type: String,
    required: true,
  },
  posts: [
    {
      _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
      },
      title: String,
      description: String,
      comments: [{
        message: String,
        user: String,
      }],
      likes: [{
        user: String,
      }]
    }
  ]
})

export default mongoose.model('User', schema)