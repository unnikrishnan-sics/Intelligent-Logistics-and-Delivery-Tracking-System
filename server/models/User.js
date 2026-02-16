const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: [6, 'Password must be at least 6 characters']
        },
        role: {
            type: String,
            enum: ['Admin', 'Driver', 'Customer'],
            default: 'Customer',
        },
        phone: {
            type: String,
            required: [true, 'Please add a phone number'],
            match: [/^\d{10,15}$/, 'Please add a valid phone number (10-15 digits)']
        },
        avatar: {
            type: String,
            default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        },
        isApproved: {
            type: Boolean,
            default: true
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Suspended'],
            default: 'Active',
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        current_coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        },
    },
    {
        timestamps: true,
    }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
