export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return new Response(JSON.stringify({ error: 'Domain parameter is required' }), {
      status: 400,
      headers: getHeaders()
    });
  }

  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return new Response(JSON.stringify({ error: 'Invalid domain format' }), {
      status: 400,
      headers: getHeaders()
    });
  }

  try {
    const rdapResponse = await fetch(`https://rdap.org/domain/${domain}`);

    if (!rdapResponse.ok) {
      const errorText = await rdapResponse.text();
      throw new Error(`RDAP API request failed: ${rdapResponse.status} ${rdapResponse.statusText}. Response: ${errorText}`);
    }

    const whoisData = await rdapResponse.json();

    return new Response(JSON.stringify({ domain, whoisData }), {
      headers: getHeaders()
    });
  } catch (error) {
    console.error('Error in WHOIS lookup:', error);

    return new Response(JSON.stringify({ 
      error: 'Error processing WHOIS data', 
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: getHeaders()
    });
  }
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}
