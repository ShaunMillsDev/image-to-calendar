const { google } = require('googleapis');
require('dotenv').config({ path: './.env' });

const client_secret = process.env.CLIENT_SECRET;
const client_id = process.env.CLIENT_ID;
const redirect_uri = process.env.REDIRECT_URI;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

module.exports = { oAuth2Client };
