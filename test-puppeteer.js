import puppeteer from 'puppeteer';
import express from 'express';

const app = express();
app.use(express.static('dist'));
const server = app.listen(3002, async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3002');
  await page.evaluate(() => setTimeout(() => { throw new Error('Test Error') }, 1000));
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
  server.close();
  process.exit(0);
});
