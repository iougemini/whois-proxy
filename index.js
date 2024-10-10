const express = require('express');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const whois = require('whois');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });

// 设置日志记录器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'whois-proxy' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// 设置速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 每个 IP 在 windowMs 内限制 100 个请求
});

app.use(limiter);

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WHOIS Proxy Service</title>
      </head>
      <body>
        <h1>WHOIS Proxy Service</h1>
        <p>Service is up and running!</p>
        <p>Usage example: <code>/api/whois?domain=example.com</code></p>
        <form action="/api/whois" method="get">
          <input type="text" name="domain" placeholder="Enter domain name">
          <button type="submit">Lookup WHOIS</button>
        </form>
      </body>
    </html>
  `);
});

app.get('/api/whois', async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    logger.warn('API called without domain parameter');
    return res.status(400).json({ error: 'Domain parameter is required' });
  }

  logger.info(`WHOIS lookup requested for domain: ${domain}`);

  try {
    const cachedData = cache.get(domain);
    if (cachedData) {
      logger.info(`Returning cached data for ${domain}`);
      return res.json(cachedData);
    }

    const data = await new Promise((resolve, reject) => {
      whois.lookup(domain, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const result = { domain, rawData: data };
    cache.set(domain, result);

    logger.info(`WHOIS lookup successful for ${domain}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error processing WHOIS data for ${domain}:`, error);
    res.status(500).json({ error: 'Error processing WHOIS data', details: error.message });
  }
});

module.exports = app;
