export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return new Response(JSON.stringify({ error: 'Domain parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const whoisResponse = await fetch(`https://whois.cloudflare.com/dns?name=${domain}`, {
      headers: {
        'Accept': 'application/dns+json'
      }
    });

    if (!whoisResponse.ok) {
      const errorText = await whoisResponse.text();
      throw new Error(`WHOIS API request failed: ${whoisResponse.status} ${whoisResponse.statusText}. Response: ${errorText}`);
    }

    const whoisData = await whoisResponse.json();

    return new Response(JSON.stringify({ domain, whoisData }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Log the error for debugging
    console.error('Error in WHOIS lookup:', error);

    return new Response(JSON.stringify({ 
      error: 'Error processing WHOIS data', 
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
