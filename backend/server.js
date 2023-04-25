const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const routes = require('./routes');
require('dotenv').config({ path: './.env' });

const app = express();

const payloadSizeLimit = '50mb';

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(bodyParser.urlencoded({ limit: payloadSizeLimit, extended: true }));
app.use(bodyParser.json({ limit: payloadSizeLimit }));
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static(__dirname + '/../frontend/public'));

app.use('/', routes);

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
});
