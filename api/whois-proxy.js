// api/whois-proxy.js

const express = require('express');
const whois = require('whois');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // 默认缓存时间为1小时

// 创建速率限制器
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});

// 应用速率限制中间件
app.use(limiter);

app.get('/whois/:domain', (req, res) => {
  const domain = req.params.domain;
  console.log(`Received WHOIS request for domain: ${domain}`);

  // 检查缓存中是否有数据
  const cachedData = cache.get(domain);
  if (cachedData) {
    console.log(`Returning cached data for ${domain}`);
    return res.json(cachedData);
  }

  whois.lookup(domain, (err, data) => {
    if (err) {
      console.error(`WHOIS lookup failed for ${domain}:`, err);
      return res.status(500).json({ error: 'WHOIS lookup failed', details: err.message });
    }

    console.log(`WHOIS data received for ${domain}`);
    try {
      const expirationDate = extractExpirationDate(data);
      const registrar = extractRegistrar(data);
      const creationDate = extractCreationDate(data);
      console.log(`Extracted info for ${domain}: Creation: ${creationDate}, Expiration: ${expirationDate}, Registrar: ${registrar}`);
      
      const result = { domain, creationDate, expirationDate, registrar, rawData: data };
      
      // 将结果存入缓存
      cache.set(domain, result);
      
      res.json(result);
    } catch (error) {
      console.error(`Error processing WHOIS data for ${domain}:`, error);
      return res.status(500).json({ error: 'Error processing WHOIS data', details: error.message });
    }
  });
});

function extractExpirationDate(whoisData) {
  const match = whoisData.match(/Expir(y|ation) Date: (.+)/i);
  if (!match) {
    console.warn('Could not extract expiration date from WHOIS data');
  }
  return match ? match[2].trim() : 'Unknown';
}

function extractRegistrar(whoisData) {
  const match = whoisData.match(/Registrar: (.+)/i);
  if (!match) {
    console.warn('Could not extract registrar from WHOIS data');
  }
  return match ? match[1].trim() : 'Unknown';
}

function extractCreationDate(whoisData) {
  const match = whoisData.match(/Creation Date: (.+)/i);
  if (!match) {
    console.warn('Could not extract creation date from WHOIS data');
  }
  return match ? match[1].trim() : 'Unknown';
}

// 导出服务器应用
module.exports = app;
