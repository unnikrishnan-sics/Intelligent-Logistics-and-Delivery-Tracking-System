# Intelligent Logistics and Delivery Tracking System (Student Version)

A full-stack logistics and delivery tracking application built with the MERN stack (MongoDB, Express, React, Node.js). This version is designed for educational purposes, with key logic points commented out for students to implement.

## Project Description

IntelliDrive is a comprehensive solution for managing logistics operations. It connects Admins, Drivers, and Customers in a seamless ecosystem to handle order creation, driver assignment, vehicle tracking, and proof of delivery. The system leverages real-time updates and route optimization to ensure efficient delivery management.

## User Functions & Flow

### 1. Admin
- **Dashboard**: View analytics (Total Orders, Drivers, Delivered, Pending).
- **User Management**: View and **delete** users (Drivers/Customers). **Approve** new driver registrations.
- **Order Management**: View all orders and **assign drivers** to pending orders.

### 2. Driver
- **Dashboard**: View assigned tasks and delivery requests.
- **Order Fulfillment**: Update order status (Accepted -> Out for Delivery -> Delivered).
- **Verification**: **Verify OTP** provided by the customer at the time of delivery.
- **Tracking**: Update current location to allow real-time tracking (Simulated).

### 3. Customer
- **Order Creation**: Place new delivery orders with pickup and destination details.
- **Tracking**: Track the status and location of their package in real-time.
- **History**: View past order history.

## Installation Guide

### Prerequisites

- **Node.js** (v14 or higher) & **npm**
- **MongoDB** (Local instance or Atlas URI)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/unnikrishnan-sics/Intelligent-Logistics-and-Delivery-Tracking-System.git
cd Intelligent-Logistics-and-Delivery-Tracking-System
```

### 2. Setup Server (Backend)

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# Optional: Email Service Credentials
# EMAIL_SERVICE=gmail
# EMAIL_USERNAME=your_email@gmail.com
# EMAIL_PASSWORD=your_email_password
# Google Maps API Key
# GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Start the server:

```bash
npm run dev
# Server running on port 5000
```

### 3. Setup Client (Frontend)

Open a new terminal, navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

Start the client application:

```bash
npm run dev
# Client running on http://localhost:5173
```
