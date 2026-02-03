// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./middleware/authRoutes');
const contentRoutes = require('./middleware/contentRoutes');
const submissionRoutes = require('./middleware/submissionRoutes');
const adminRoutes = require('./middleware/adminRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reading_learning_db';

// Connect to MongoDB
async function connectDB() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        console.log(`📁 Database: reading_learning_db`);
        
        await mongoose.connect(MONGODB_URI);
        
        console.log('✅ MongoDB connected successfully!');
        console.log(`📊 Connected to: ${mongoose.connection.name}`);
        console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔍 MongoDB is not running!');
            console.log('Start it with:');
            console.log('   "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe"');
        }
        
        process.exit(1);
    }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Reading & Learning API',
        status: 'running',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            content: '/api/content',
            submissions: '/api/submissions',
            admin: '/api/admin'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const status = dbStatus === 1 ? 'healthy' : 'unhealthy';
    
    res.json({
        status: status,
        database: dbStatus === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Database info endpoint
app.get('/api/db-info', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);
        
        // Get counts for each collection
        const counts = {};
        for (const collection of collections) {
            try {
                const count = await db.collection(collection.name).countDocuments();
                counts[collection.name] = count;
            } catch (err) {
                counts[collection.name] = 'error';
            }
        }
        
        res.json({
            database: mongoose.connection.name,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            collections: collectionNames,
            counts: counts,
            collectionCount: collections.length,
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test endpoints
app.get('/api/test/login', async (req, res) => {
    res.json({
        message: 'Login test endpoint',
        method: 'POST',
        url: '/api/auth/login',
        required_fields: ['email', 'password']
    });
});

app.get('/api/test/register', async (req, res) => {
    res.json({
        message: 'Register test endpoint',
        method: 'POST',
        url: '/api/auth/register',
        required_fields: ['name', 'email', 'password'],
        optional_fields: ['grade', 'role']
    });
});

// 404 handler - MUST BE THE LAST ROUTE (FIXED: using app.all instead of app.use with '*')
// 404 handler - MUST BE THE LAST ROUTE
app.use((req, res, next) => {
    if (req.path === '/') {
        return next(); // Skip for root path
    }
    res.status(404).json({
        error: 'Endpoint not found',
        requested_url: req.originalUrl,
        available_endpoints: {
            root: '/',
            health: '/health',
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                profile: 'GET /api/auth/profile'
            },
            content: {
                list: 'GET /api/content',
                create: 'POST /api/content'
            },
            submissions: {
                submit: 'POST /api/submissions/submit-quiz',
                student: 'GET /api/submissions/student/:studentId',
                admin: 'GET /api/submissions/admin/submissions'
            },
            admin: {
                users: 'GET /api/admin/users',
                content: 'GET /api/admin/content',
                deleteUser: 'DELETE /api/admin/users/:userId',
                resetAttempts: 'POST /api/admin/users/:userId/reset-attempts'
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 4000;

async function startServer() {
    await connectDB();
    
    // Check for JWT_SECRET
    if (!process.env.JWT_SECRET) {
        console.error('❌ FATAL ERROR: JWT_SECRET is not defined in .env file');
        process.exit(1);
    }

    // Create indexes if needed
    await createIndexes();
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log(`📊 Health: http://localhost:${PORT}/health`);
        console.log(`🔑 Auth API: http://localhost:${PORT}/api/auth`);
        console.log(`📚 Content API: http://localhost:${PORT}/api/content`);
        console.log(`📝 Submissions API: http://localhost:${PORT}/api/submissions`);
        console.log(`👨‍🏫 Admin API: http://localhost:${PORT}/api/admin`);
        
        console.log('\n📋 Quick Test Commands:');
        console.log('=====================');
        console.log(`Test server: curl http://localhost:${PORT}/`);
        console.log(`Register: curl -X POST http://localhost:${PORT}/api/auth/register \\`);
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"name":"Test","email":"test@test.com","password":"test123","grade":"Grade 4"}\'');
        console.log(`Login: curl -X POST http://localhost:${PORT}/api/auth/login \\`);
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"email":"test@test.com","password":"test123"}\'');
    });
}

// Create database indexes
async function createIndexes() {
    try {
        const db = mongoose.connection.db;
        
        // Create indexes for better performance
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('submissions').createIndex({ studentId: 1, submittedAt: -1 });
        await db.collection('contents').createIndex({ grade: 1, subject: 1 });
        
        console.log('✅ Database indexes created');
    } catch (error) {
        console.log('⚠️  Could not create indexes:', error.message);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Server terminated');
    await mongoose.connection.close();
    process.exit(0);
});

startServer();