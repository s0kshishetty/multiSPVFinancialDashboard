import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Overview from './pages/Overview';
import SPVDetail from './pages/SPVDetail';
import Compare from './pages/Compare';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Tests from './pages/Tests';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Overview />} />
          <Route path="spv/:id" element={<SPVDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="tests" element={<Tests />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
