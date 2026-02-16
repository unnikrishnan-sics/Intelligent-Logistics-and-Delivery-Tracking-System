const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed Admin if not exists
    const User = require('../models/User');
    const adminExists = await User.findOne({ role: 'Admin' });
    if (!adminExists) {
      console.log('No Admin found. Seeding default admin...'.yellow);
      await User.create({
        name: 'Super Admin',
        email: 'admin@gmail.com',
        password: 'admin@123',
        role: 'Admin',
        phone: '1234567890',
      });
      console.log('Default Admin seeded successfully!'.green);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
