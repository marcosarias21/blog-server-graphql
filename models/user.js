const { default: mongoose } = require("mongoose");

const schema = new mongoose.schema({
  username: {
    type: String,
    required: true,
    uniquie: true,
    minlenght: 3
  },
  password: {
    type: String,
    required: true,
  },
  Posts: [
    {
      ref: 'Post',
      type: mongoose.Schema.Types.ObjectId(),
    }
  ]
})

export default mongoose.model('User', schema)