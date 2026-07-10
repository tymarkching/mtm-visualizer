import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('dist/index.html', 'utf-8');

const virtualConsole = new VirtualConsole();
virtualConsole.on("error", (err) => { console.error("VC ERROR:", err); });
virtualConsole.on("warn", (warn) => { console.warn("VC WARN:", warn); });
virtualConsole.on("info", (info) => { console.info("VC INFO:", info); });
virtualConsole.on("log", (log) => { console.log("VC LOG:", log); });
virtualConsole.on("jsdomError", (err) => { console.error("JSDOM ERROR:", err); });

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
});

// Polyfills
dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
dom.window.cancelAnimationFrame = (id) => clearTimeout(id);
dom.window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
dom.window.HTMLMediaElement.prototype.play = async () => {};
dom.window.HTMLMediaElement.prototype.pause = () => {};
dom.window.HTMLMediaElement.prototype.load = () => {};
dom.window.HTMLCanvasElement.prototype.getContext = () => { return { fillRect: ()=>{}, clearRect: ()=>{}, putImageData: ()=>{}, createImageData: ()=>({data:[]}), drawImage: ()=>{}, beginPath: ()=>{}, moveTo: ()=>{}, lineTo: ()=>{}, stroke: ()=>{}, save: ()=>{}, restore: ()=>{}, scale: ()=>{}, translate: ()=>{}, rotate: ()=>{}, arc: ()=>{}, fill: ()=>{}, measureText: ()=>({width:10}), createLinearGradient: ()=>({addColorStop:()=>{}}), createRadialGradient: ()=>({addColorStop:()=>{}}) } };
dom.window.AudioContext = class {
  createAnalyser() { return { connect: () => {}, disconnect: () => {}, frequencyBinCount: 1024, getByteFrequencyData: () => {}, getByteTimeDomainData: () => {} } }
  createMediaElementSource() { return { connect: () => {} } }
  createGain() { return { connect: () => {}, gain: { value: 1 } } }
};
dom.window.URL.createObjectURL = () => "blob:fake";

setTimeout(() => {
  console.log("Body HTML:");
  console.log(dom.window.document.body.innerHTML);
  process.exit(0);
}, 2000);
