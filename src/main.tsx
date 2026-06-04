import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initDatabase } from './db/database';
import { checkAndGenerateReport } from './utils/reportScheduler';
import { getBudgetsWithSpending } from './db/budgets';
import { getSetting } from './db/settings';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import './index.css';
import App from './App';

const sendBudgetAlert = async (title: string, body: string) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 10000),
        title,
        body,
        schedule: { at: new Date(Date.now() + 500) },
        sound: undefined,
        attachments: undefined,
        actionTypeId: '',
        extra: null,
      }],
    });
  } catch (err) {
    console.error('Alert error:', err);
  }
};

const checkBudgetAlerts = async (): Promise<void> => {
  try {
    const budgets = await getBudgetsWithSpending();
    for (const budget of budgets) {
      const percent = (budget.spent / budget.limit) * 100;
      if (percent >= 100) {
        await sendBudgetAlert(
          `⚠️ Budget Exceeded — ${budget.category}`,
          `You've spent ${Math.round(percent)}% of your ${budget.category} budget this ${budget.period}.`
        );
      } else if (percent >= 75) {
        await sendBudgetAlert(
          `🔔 Budget Warning — ${budget.category}`,
          `You've used ${Math.round(percent)}% of your ${budget.category} budget. RF ${Math.round(budget.limit - budget.spent).toLocaleString()} remaining.`
        );
      }
    }
  } catch (err) {
    console.error('Budget check error:', err);
  }
};

const startApp = async (): Promise<void> => {
  try {
    await initDatabase();
    console.log('SafeSpend database ready');

    const currency = (await getSetting('currency')) || 'RWF';
    await checkBudgetAlerts();
    const generated = await checkAndGenerateReport(currency);
    if (generated) console.log('Scheduled report generated');
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
