const { google } = require('googleapis');

// Add event to user's calendar
async function createCalendarEvents(extractedTexts, auth) {
    const calendar = google.calendar({ version: 'v3', auth, timeZone: null });

    for (const eventDetails of extractedTexts) {
        const [day, date, startTime, endTime, location] = eventDetails;

        const event = {
            summary: 'Work',
            location: location,
            start: {
                dateTime: `${date}T${startTime}:00`,
                timeZone: 'America/New_York',
            },
            end: {
                dateTime: `${date}T${endTime}:00`,
                timeZone: 'America/New_York',
            },
        };

        await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
    }
}

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
    return resultDate.getFullYear() + '-' + ('0' + (resultDate.getMonth() + 1)).slice(-2) + '-' + ('0' + resultDate.getDate()).slice(-2);
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

    // Get period 
    const periodRegex = /PM|AM/g;
    const startTimePeriod = cleanedString.match(periodRegex)[0];
    const endTimePeriod = cleanedString.match(periodRegex)[1];

    // Get times
    const timeRegex = /[0-9]{2}:[0-9]{2}/g;
    const startTime = convertTo24Hour(cleanedString.match(timeRegex)[0], startTimePeriod);
    const endTime = convertTo24Hour(cleanedString.match(timeRegex)[1], endTimePeriod);

    // Get location
    const locationRegex = /[0-9]{5}.*/;
    const location = cleanedString.match(locationRegex)[0];

    return [dayOfWeek, resultDate, startTime, endTime, location]
}

module.exports = {
    createCalendarEvents,
    getDateFromDay,
    convertTo24Hour,
    filter_text,
};