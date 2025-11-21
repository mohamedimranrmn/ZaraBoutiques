const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: function() {
            // Password is only required if user doesn't have a googleId
            return !this.googleId;
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null/undefined values
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model("User", userSchema);