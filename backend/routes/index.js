const express = require('express');
const router = express.Router();
const { oAuth2Client } = require('../config/oauth2');
const { createCalendarEvents, filter_text } = require('../helpers');
const Tesseract = require('tesseract.js')

// Handle GET requests to the root URL
router.get('/', (req, res) => {
    res.sendFile(__dirname + '/../frontend/public/index.html');
});

// Handles redirect from authentication
router.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;

    if (code) {
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);

            // Retrieve the extractedTexts array from the session
            const extractedTexts = req.session.extractedTexts;

            // Call the function to create events in the user's calendar
            await createCalendarEvents(extractedTexts, oAuth2Client);

            res.send('Events added to your calendar');
        } catch (error) {
            console.error('Error processing the callback:', error);
            res.status(500).send('Error processing the callback');
        }
    } else {
        res.status(400).send('Invalid request');
    }
});

// Handles extracting text from images and providing user with authentication url
router.post('/extract-text', async (req, res) => {
    const extractedTexts = [];
    const images = req.body.images;

    for (let i = 0; i < images.length; i++) {
        const base64 = images[i]

        // Decode base64 image data
        const buffer = Buffer.from(base64, 'base64');

        try {
            // Extract text from image using Tesseract OCR
            const { data } = await Tesseract.recognize(buffer, 'eng');

            // Filter extracted text using a filter_text function
            const filteredText = filter_text(data.text);

            // Add filtered text to extractedTexts array
            extractedTexts.push(filteredText);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error processing image');
            return;
        }
    }

    // Store the extractedTexts array in the session
    req.session.extractedTexts = extractedTexts;

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events'],
    });
    res.json({ authUrl })
});

module.exports = router;
