import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AddTransaction from './pages/AddTransaction';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Budgets from './pages/Budgets';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/budgets" element={<Budgets />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
