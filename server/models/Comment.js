const { Schema, model } = require('mongoose');

const commentSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        blob: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
        toJSON: {
            virtuals: true,
        },
    }
);

const Comment = model('Comment', commentSchema);

module.exports = Comment;