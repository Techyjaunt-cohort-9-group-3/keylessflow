const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { nodeEnv, corsOrigin, trustProxy } = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const API_PREFIX = '/api/v1';

const app = express();

if (trustProxy) app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()) }));
app.use(
  express.json({
    limit: '1mb',
    // Keep the exact bytes of Paystack webhooks to check their signature
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith(`${API_PREFIX}/payments/webhook`)) req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true }));
if (nodeEnv !== 'test') app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to the KeylessFlow API', docs: `${API_PREFIX}/health` });
});

app.use(API_PREFIX, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
