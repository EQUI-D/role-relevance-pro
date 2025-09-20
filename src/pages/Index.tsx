import { useState, useEffect } from "react";
import LoaderScreen from "@/components/LoaderScreen";
import LoginScreen from "@/components/LoginScreen";
import StudentDashboard from "@/components/StudentDashboard";
import PlacementDashboard from "@/components/PlacementDashboard";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<'loading' | 'login' | 'dashboard'>('loading');
  const [user, setUser] = useState<any>(null);

  const handleLoaderComplete = () => {
    setCurrentScreen('login');
  };

  const handleLogin = (userType: 'student' | 'placement', userData: any) => {
    setUser({ ...userData, type: userType });
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  if (currentScreen === 'loading') {
    return <LoaderScreen onComplete={handleLoaderComplete} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === 'dashboard' && user) {
    if (user.type === 'student') {
      return <StudentDashboard user={user} onLogout={handleLogout} />;
    } else {
      return <PlacementDashboard user={user} onLogout={handleLogout} />;
    }
  }

  return null;
};

export default Index;
