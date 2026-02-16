# Intelligent Logistics and Delivery Tracking System (Student Version)

A full-stack logistics and delivery tracking application built with the MERN stack (MongoDB, Express, React, Node.js). This version is designed for educational purposes, with key logic points commented out for students to implement.

## Project Structure

- **client/**: The frontend React application.
- **server/**: The backend Node.js/Express API.

## Features (Student Implementation Required)

- **Authentication**: User registration and login. *Implementation Exercise: User Profile Retrieval.*
- **Admin Dashboard**: Manage users (Drivers/Customers). *Implementation Exercise: User Deletion & Approval.*
- **Order Management**: Create orders, assign drivers, and track status. *Implementation Exercise: Driver Assignment, Status Updates, OTP Verification.*
- **Real-time Tracking**: Track delivery vehicles. *Implementation Exercise: ETA Calculation.*
- **Route Optimization**: Optimize delivery routes. *Implementation Exercise: Nearest Neighbor Algorithm.*

## Prerequisites

Before running the project, ensure you have the following installed:

1.  **Node.js** (v14 or higher) & **npm**
2.  **MongoDB** (Local instance or Atlas URI)
3.  **Git**

## Installation Guide

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
# Optional: Email Service Credentials (if email features are enabled)
# EMAIL_SERVICE=gmail
# EMAIL_USERNAME=your_email@gmail.com
# EMAIL_PASSWORD=your_email_password
# Google Maps API Key (for tracking features)
# GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Setup Client (Frontend)

Navigate to the client directory and install dependencies:

```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory (if needed, usually optional for dev) or update `vite.config.js` / API settings if your server runs on a different port. By default, it expects `http://localhost:5000`.

## Running the Application

### Option 1: Run Selectively

**Run Server:**
Open a terminal in the `server` directory:
```bash
npm run dev
# Server running on port 5000
```

**Run Client:**
Open a separate terminal in the `client` directory:
```bash
npm run dev
# Client running on http://localhost:5173 (or similar)
```

### Option 2: Run Concurrently (If configured)

If a root `package.json` is configured for concurrent running (check root folder), you can run:

```bash
npm run dev
```

(Note: If `concurrently` is not set up in the root, stick to Option 1).

## Student Implementation Guide

Navigate to the following files and look for `// TODO` comments to implement the missing logic:

1.  **Server**: `server/controllers/authController.js` - `getUserProfile`
2.  **Server**: `server/controllers/adminController.js` - `deleteUser`, `approveUser`
3.  **Server**: `server/controllers/orderController.js` - `assignDriver`, `updateOrderStatus`, `verifyOrderOTP`
4.  **Server**: `server/controllers/trackingController.js` - `getETA`
5.  **Client**: `client/src/utils/RouteOptimizer.js` - `optimizeRoute`, `predictETA`

## API Endpoints (Quick Reference)

- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`
- **Users**: `GET /api/admin/drivers`, `GET /api/admin/customers`
- **Orders**: `POST /api/orders`, `GET /api/orders`, `PUT /api/orders/:id/assign`
- **Tracking**: `PUT /api/tracking/update`, `GET /api/tracking/:orderId/history`

## License

This project is for educational purposes.
