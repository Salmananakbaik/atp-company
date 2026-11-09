
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

import 'leaflet/dist/leaflet.css';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Element root tidak ditemukan di index.html');
}

createRoot(rootElement).render(<App />);
