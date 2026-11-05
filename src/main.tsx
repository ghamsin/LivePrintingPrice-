import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as unknown as { __VITE_APP_MOUNTED__?: boolean }).__VITE_APP_MOUNTED__ = true;

createRoot(document.getElementById('root')!).render(<App />);
