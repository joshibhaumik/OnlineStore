const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item"
    },
    comment: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

const comments = mongoose.model("Comment", commentSchema);

module.exports = comments;
