import React, { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import AreaSelectionScreen from './components/AreaSelection';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { UserData } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const handleLoginSuccess = (userData: UserData) => {
      setUser(userData);
      if (userData.role === 'admin_area' && userData.assignedArea) {
          setSelectedArea(userData.assignedArea);
      }
  };

  const handleLogout = () => { setUser(null); setSelectedArea(null); };

  if (!user) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  
  if (!selectedArea) return <AreaSelectionScreen user={user} onSelectArea={setSelectedArea} onLogout={handleLogout} />;
  
  if (['admin_area', 'general_admin', 'admin_vendor'].includes(user.role)) {
    return <AdminDashboard user={user} area={selectedArea} logout={handleLogout} />;
  }

  return <EmployeeDashboard user={user} area={selectedArea} logout={handleLogout} />;
};

export default App;
