import { useAuth } from '@/contexts/AuthContext';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ManagerDashboard } from './ManagerDashboard';

export const Dashboard = () => {
  const { user } = useAuth();

  // Managers and admins see the manager dashboard
  // Employees see the employee dashboard
  if (user?.role === 'manager' || user?.role === 'admin') {
    return <ManagerDashboard />;
  }

  return <EmployeeDashboard />;
};
