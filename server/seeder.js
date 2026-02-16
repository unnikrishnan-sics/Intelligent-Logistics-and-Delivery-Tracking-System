const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('./models/User');
const Order = require('./models/Order');
const Vehicle = require('./models/Vehicle');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await Order.deleteMany();
        await Vehicle.deleteMany();
        await User.deleteMany();

        const users = [
            {
                name: 'Super Admin',
                email: 'admin@gmail.com',
                password: 'admin@123',
                role: 'Admin',
                phone: '1234567890',
            },
            {
                name: 'John Driver',
                email: 'd@gmail.com',
                password: 'd@123',
                role: 'Driver',
                phone: '9876543210',
            },
            {
                name: 'Jane Driver',
                email: 'd2@gmail.com',
                password: 'd2@123',
                role: 'Driver',
                phone: '9876543211',
            },
            {
                name: 'Alice Customer',
                email: 'c@gmail.com',
                password: 'c@123',
                role: 'Customer',
                phone: '5555555555',
            },
        ];

        const createdUsers = await User.create(users);

        const admin = createdUsers[0]._id;
        const driver1 = createdUsers[1]._id;
        const driver2 = createdUsers[2]._id;
        const customer = createdUsers[3]._id;

        const vehicles = [
            {
                driver_id: driver1,
                vehicle_number: 'KA-01-AB-1234',
                model: 'Tata Ace',
                current_coordinates: { lat: 12.9716, lng: 77.5946 },
                status: 'Active',
            },
            {
                driver_id: driver2,
                vehicle_number: 'KA-02-CD-5678',
                model: 'Mahindra Bolero',
                current_coordinates: { lat: 13.00, lng: 77.60 },
                status: 'Active',
            },
        ];

        await Vehicle.create(vehicles);

        console.log('Data Imported!'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Vehicle.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
