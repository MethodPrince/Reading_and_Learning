// middleware/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require("./models/User");
const Content = require("./models/Content");
const Submission = require("./models/Submission");
const { authMiddleware, adminMiddleware } = require('./auth');

// ... rest of the file remains the same
// Apply both auth and admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all content
router.get('/content', async (req, res) => {
    try {
        const content = await Content.find();
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.userId);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset user attempts
router.post('/users/:userId/reset-attempts', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { attemptsUsed: 0 },
            { new: true }
        ).select('-password');
        
        res.json({ 
            message: 'Attempts reset successfully',
            user 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;