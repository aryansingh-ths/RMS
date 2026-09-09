import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import ModuleA from './modules/CustomerKiosk/ModuleA';
import ModuleB from './modules/SalesOpsPortal/ModuleB';
import ModuleC from './modules/AdminConsole/ModuleC';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/customer-kiosk" element={<ModuleA />} />
        <Route path="/sales-and-operations" element={<ModuleB />} />
        <Route path="/admin-console" element={<ModuleC />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
