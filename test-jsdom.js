import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('dist/index.html', 'utf-8');

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable"
});

dom.window.addEventListener('error', (event) => {
  console.error("PAGE ERROR:", event.error);
});

// Mock requestAnimationFrame
dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
dom.window.cancelAnimationFrame = (id) => clearTimeout(id);
// Mock ResizeObserver
dom.window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
// Mock HTMLMediaElement
dom.window.HTMLMediaElement.prototype.play = async () => {};
dom.window.HTMLMediaElement.prototype.pause = () => {};
dom.window.HTMLMediaElement.prototype.load = () => {};
// AudioContext
dom.window.AudioContext = class {
  createAnalyser() { return { connect: () => {}, disconnect: () => {}, frequencyBinCount: 1024, getByteFrequencyData: () => {}, getByteTimeDomainData: () => {} } }
  createMediaElementSource() { return { connect: () => {} } }
  createGain() { return { connect: () => {}, gain: { value: 1 } } }
};

setTimeout(() => {
  console.log("DOM loaded");
  console.log("Body length:", dom.window.document.body.innerHTML.length);
  process.exit(0);
}, 2000);
