module.exports = (req, res) => {
  res.status(200).send(`
    <html>
      <head>
        <title>WHOIS Proxy Service</title>
      </head>
      <body>
        <h1>WHOIS Proxy Service</h1>
        <p>Service is up and running!</p>
        <p>Usage example: <code>/api/whois?domain=example.com</code></p>
      </body>
    </html>
  `);
};
