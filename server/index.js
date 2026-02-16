const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

connectDB();

const app = express();
const User = require('./models/User');
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
    res.send('iLDTS API is running...');
});

// Auth Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Admin Routes
app.use('/api/admin', require('./routes/adminRoutes'));

// Order Routes
app.use('/api/orders', require('./routes/orderRoutes'));

// Tracking Routes
app.use('/api/tracking', require('./routes/trackingRoutes'));

// Chat Routes
app.use('/api/chat', require('./routes/chatRoutes'));

// Review Routes
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Socket.io Real-time tracking & Chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Tracking Events
    socket.on('join_order', (orderId) => {
        socket.join(orderId);
        console.log(`User joined order room: ${orderId}`);
    });

    socket.on('update_location', async (data) => {
        // data: { orderId, driverId, lat, lng }
        if (data.orderId) {
            io.to(data.orderId).emit('location_updated', data);
        }

        // Also update driver's global location
        if (data.driverId) {
            try {
                await User.findByIdAndUpdate(data.driverId, {
                    current_coordinates: { lat: data.lat, lng: data.lng },
                    isOnline: true // Ensure they are marked online
                });
                io.emit('driver_location_updated', data);
            } catch (error) {
                console.error('Error updating driver location:', error);
            }
        }
    });

    // General location ping for drivers without active orders
    socket.on('driver_location_ping', async (data) => {
        // data: { driverId, lat, lng }
        try {
            await User.findByIdAndUpdate(data.driverId, {
                current_coordinates: { lat: data.lat, lng: data.lng },
                isOnline: true
            });
            io.emit('driver_location_updated', data); // Data now includes name/avatar from client
        } catch (error) {
            console.error('Error handling driver ping:', error);
        }
    });

    // Chat Events
    socket.on('join_chat', (orderId) => {
        socket.join(`chat_${orderId}`);
        console.log(`User joined chat room: chat_${orderId}`);
    });

    socket.on('send_message', (data) => {
        // data: { orderId, message, sender: { name, role, _id } }
        io.to(`chat_${data.orderId}`).emit('receive_message', data);
    });

    // Driver Status Events
    socket.on('driver_connect', async (userId) => {
        try {
            await User.findByIdAndUpdate(userId, { isOnline: true });
            socket.userId = userId; // Store userId in socket session
            io.emit('driver_status_updated', { driverId: userId, isOnline: true });
        } catch (error) {
            console.error('Error updating driver status:', error);
        }
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected');
        if (socket.userId) {
            try {
                await User.findByIdAndUpdate(socket.userId, { isOnline: false });
                io.emit('driver_status_updated', { driverId: socket.userId, isOnline: false });
            } catch (error) {
                console.error('Error updating driver status on disconnect:', error);
            }
        }
    });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

if (require.main === module) {
    httpServer.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

module.exports = httpServer; // Export for testing
