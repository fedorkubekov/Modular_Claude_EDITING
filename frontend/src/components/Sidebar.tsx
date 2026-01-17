import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon?: string;
}

export const Sidebar = () => {
  const { user } = useAuth();

  // Define navigation items based on user role
  const getNavItems = (): NavItem[] => {
    if (user?.role === 'manager' || user?.role === 'admin') {
      return [
        { path: '/dashboard', label: 'Manager Dashboard' },
        { path: '/employee-management', label: 'Employee Management' },
      ];
    } else {
      return [
        { path: '/dashboard', label: 'Employee Dashboard' },
        { path: '/my-schedule', label: 'My Schedule' },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Module</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};
