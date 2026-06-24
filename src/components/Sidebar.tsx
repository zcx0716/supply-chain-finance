import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  FileSignature, 
  Settings,
  Building2
} from 'lucide-react';
import { useAppStore } from '../store';

interface MenuItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '首页', icon: LayoutDashboard },
  { path: '/customers', label: '客户管理', icon: Users },
  { path: '/orders', label: '订单管理', icon: FileText },
  { path: '/payments', label: '回款管理', icon: DollarSign },
  { path: '/contracts', label: '合同管理', icon: FileSignature },
  { path: '/system', label: '系统管理', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const { user } = useAppStore();
  const currentRole = user?.role || 'user';

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(currentRole);
  });

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">供应链金融</h1>
            <p className="text-xs text-slate-400">工作平台</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 text-center">
          © 2024 供应链金融平台
        </div>
      </div>
    </aside>
  );
}