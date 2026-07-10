import puppeteer from 'puppeteer';
import express from 'express';

const app = express();
app.use(express.static('dist'));
const server = app.listen(3002, async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3002');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML.substring(0, 1000));
  console.log("Root content:\n", rootHtml);
  
  await browser.close();
  server.close();
  process.exit(0);
});
