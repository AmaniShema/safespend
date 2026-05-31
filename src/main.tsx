import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initDatabase } from './db/database';
import { checkAndGenerateReport } from './utils/reportScheduler';
import { getSetting } from './db/settings';
import './index.css';
import App from './App';

const startApp = async (): Promise<void> => {
  try {
    await initDatabase();
    console.log('SafeSpend database ready');

    const currency = (await getSetting('currency')) || 'RWF';
    const generated = await checkAndGenerateReport(currency);
    if (generated) {
      console.log('Scheduled report generated');
    }
  } catch (error) {
    console.error('Startup error:', error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

startApp();
