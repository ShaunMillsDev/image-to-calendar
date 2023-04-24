
const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// convert three letter day into date this week
function getDateFromDay(dayPrefix) {
    const today = new Date();
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayIndex = days.indexOf(dayPrefix.toLowerCase());
    let daysDiff = dayIndex - today.getDay();
    if (daysDiff <= 0) {
        daysDiff += 7;
    }
    const resultDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysDiff);
    return resultDate.getFullYear() + '/' + ('0' + (resultDate.getMonth() + 1)).slice(-2) + '/' + ('0' + resultDate.getDate()).slice(-2);
}

// Converts time to 24 hour format
function convertTo24Hour(time, period) {
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Filters the input text to only extract specific information
function filter_text(inputString) {

    // Remove newline and special characters
    const removeNewlineAndSpecialChar = /\n|©|-/g;
    const cleanedString = inputString.replace(removeNewlineAndSpecialChar, '');

    // Get dayOfWeek
    const dayOfWeekRegex = /^[a-zA-Z]{3}/i;
    const dayOfWeek = cleanedString.match(dayOfWeekRegex)[0];
    const resultDate = getDateFromDay(dayOfWeek);

    // Get startTime
    const timeRegex = /[0-9]{2}:[0-9]{2}/g;
    const startTime = convertTo24Hour(cleanedString.match(timeRegex)[0], 'AM');

    // Get endTime
    const endTime = convertTo24Hour(cleanedString.match(timeRegex)[1], 'PM');

    // Get location
    const locationRegex = /[0-9]{5}.*/;
    const location = cleanedString.match(locationRegex)[0];

    return [dayOfWeek, resultDate, startTime, endTime, location]
}

app.post('/extract-text', upload.array('images'), async (req, res) => {
    const extractedTexts = [];

    // Process each image file
    for (const file of req.files) {
        try {
            const { data } = await Tesseract.recognize(file.buffer, 'eng');
            const filtered_string = filter_text(data.text);
            extractedTexts.push(filtered_string);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error processing image');
            return;
        }
    }

    // Return the array of extracted texts
    res.json({ extractedTexts });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});