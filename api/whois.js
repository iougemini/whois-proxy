const whois = require('whois');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 3600 });

module.exports = async (req, res) => {
  console.log('WHOIS API called');
  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Domain parameter is required' });
  }

  try {
    const cachedData = cache.get(domain);
    if (cachedData) {
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

    res.json(result);
  } catch (error) {
    console.error(`Error processing WHOIS data for ${domain}:`, error);
    res.status(500).json({ error: 'Error processing WHOIS data', details: error.message });
  }
};
