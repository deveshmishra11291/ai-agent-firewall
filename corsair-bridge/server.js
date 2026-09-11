require('dotenv').config();
const express = require('express');
const { toExpressHandler } = require('corsair');
const { corsair } = require('./corsair');

const app = express();

// Capture rawBody for Corsair HMAC signature verification
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use('/api/corsair', toExpressHandler(corsair, { basePath: '/api/corsair' }));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-agent-firewall-corsair-bridge',
    port: Number(process.env.PORT) || 3001,
    endpoints: {
      connectGithub: '/connect-github',
      corsairWebhook: '/api/corsair',
    },
  });
});

app.get('/connect-github', async (req, res) => {
  try {
    const { connectUrl } = await corsair.manage.connect.createLink({
      plugin: 'github',
      tenantId: 'default',
    });
    res.redirect(connectUrl);
  } catch (err) {
    console.error('[connect-github] Error creating link:', err);
    res.status(500).send(`Error creating GitHub connect link: ${err.message}`);
  }
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`[corsair-bridge] listening on port ${port}`);
});
