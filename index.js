const express = require('express');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
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
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WHOIS 代理服务</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #fff;
          border-radius: 5px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #2c3e50;
          text-align: center;
        }
        .description {
          text-align: center;
          margin-bottom: 20px;
        }
        .usage {
          background-color: #e7f2fa;
          border-left: 4px solid #3498db;
          padding: 10px;
          margin-bottom: 20px;
        }
        code {
          background-color: #f8f8f8;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
        }
        form {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        input[type="text"] {
          width: 60%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px 0 0 4px;
          font-size: 16px;
        }
        button {
          padding: 10px 20px;
          background-color: #3498db;
          color: #fff;
          border: none;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #2980b9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>WHOIS 代理服务</h1>
        <p class="description">欢迎使用我们的 WHOIS 代理服务！</p>
        <div class="usage">
          <p><strong>使用示例：</strong></p>
          <code>/api/whois?domain=example.com</code>
        </div>
        <form action="/api/whois" method="get">
          <input type="text" name="domain" placeholder="输入域名" required>
          <button type="submit">查询 WHOIS</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

module.exports = app;
