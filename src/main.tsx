import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initDatabase } from './db/database';
import './index.css';
import App from './App';

const startApp = async (): Promise<void> => {
  try {
    await initDatabase();
    console.log('SafeSpend database ready');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

startApp();
