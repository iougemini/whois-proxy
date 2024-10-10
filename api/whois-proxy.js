const whois = require('whois');
const NodeCache = require('node-cache');

// 创建缓存实例，默认缓存时间为1小时
const cache = new NodeCache({ stdTTL: 3600 });

module.exports = async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Domain parameter is required' });
  }

  console.log(`Received WHOIS request for domain: ${domain}`);

  // 检查缓存中是否有数据
  const cachedData = cache.get(domain);
  if (cachedData) {
    console.log(`Returning cached data for ${domain}`);
    return res.json(cachedData);
  }

  try {
    const data = await new Promise((resolve, reject) => {
      whois.lookup(domain, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

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
    res.status(500).json({ error: 'Error processing WHOIS data', details: error.message });
  }
};

function extractExpirationDate(whoisData) {
  const match = whoisData.match(/Expir(y|ation) Date: (.+)/i);
  return match ? match[2].trim() : 'Unknown';
}

function extractRegistrar(whoisData) {
  const match = whoisData.match(/Registrar: (.+)/i);
  return match ? match[1].trim() : 'Unknown';
}

function extractCreationDate(whoisData) {
  const match = whoisData.match(/Creation Date: (.+)/i);
  return match ? match[1].trim() : 'Unknown';
}
