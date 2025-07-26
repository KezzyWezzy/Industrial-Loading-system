// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { 
  SystemDashboard,
  TankManagement,
  LoadingBays,
  TransactionList,
  AlarmSystem,
  MaintenanceManagement,
  UserManagement,
  SystemConfiguration,
  BackupRecovery,
  CausticHandling
} from './modules';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<SystemDashboard />} />
          <Route path="/tanks" element={<TankManagement />} />
          <Route path="/loading-bays" element={<LoadingBays />} />
          <Route path="/transactions" element={<TransactionList />} />
          <Route path="/alarms" element={<AlarmSystem />} />
          <Route path="/maintenance" element={<MaintenanceManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/system-config" element={<SystemConfiguration />} />
          <Route path="/backup" element={<BackupRecovery />} />
          <Route path="/caustic" element={<CausticHandling />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;