import fetch from 'node-fetch';

export default async function handler(req, res) {
  let domain = req.query.domain;

  // 如果 domain 不在查询参数中，尝试从路径中获取
  if (!domain && req.url) {
    const matches = req.url.match(/\/api\/whois\/(.+)/);
    if (matches && matches[1]) {
      domain = matches[1];
    }
  }

  if (!domain) {
    return res.status(400).json({ error: 'Domain parameter is required' });
  }

  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return res.status(400).json({ error: 'Invalid domain format' });
  }

  try {
    const rdapResponse = await fetch(`https://rdap.org/domain/${domain}`);

    if (!rdapResponse.ok) {
      const errorText = await rdapResponse.text();
      throw new Error(`RDAP API request failed: ${rdapResponse.status} ${rdapResponse.statusText}. Response: ${errorText}`);
    }

    const whoisData = await rdapResponse.json();

    res.status(200).json({ domain, whoisData });
  } catch (error) {
    console.error('Error in WHOIS lookup:', error);

    res.status(500).json({ 
      error: 'Error processing WHOIS data', 
      details: error.message,
      stack: error.stack
    });
  }
}
