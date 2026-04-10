import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { injectNodeAnimationCSS } from './utils/nodeAnimations';
import 'katex/dist/katex.min.css';
import './styles.css';

// Inject keyframe CSS for node entry/exit animations on app init
injectNodeAnimationCSS();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
