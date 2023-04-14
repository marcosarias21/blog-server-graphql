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
      title: String,
      description: String,
      comments: [{
        message: String,
        user: String,
      }],
    }
  ]
})

export default mongoose.model('User', schema)