// middleware/contentRoutes.js
const express = require('express');
const router = express.Router();
const Content = require("./models/Content");
const { authMiddleware } = require('./auth');

// Get content by grade
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { grade } = req.query;
        
        let query = {};
        if (grade) {
            query.grade = grade;
        }
        
        const content = await Content.find(query);
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new content (admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const content = new Content(req.body);
        await content.save();
        res.status(201).json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;