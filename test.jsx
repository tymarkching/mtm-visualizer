import React from 'react';
import { renderToString } from 'react-dom/server';
import { useSpring } from 'motion/react';

function App() {
  const spring = useSpring(0);
  spring.set(1);
  return <div>{spring.get()}</div>;
}

console.log(renderToString(<App />));
