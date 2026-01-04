import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // أضفنا useNavigate
import { LayoutDashboard, Building2, ClipboardCheck, Scale, FileBarChart, Menu, X, ShieldAlert, Settings, LogOut } from 'lucide-react';
import { getSettings } from '../services/db';
import { useUi } from '../contexts/UiContext';

// 1. تعديل المكون ليقبل دالة onClick
const SidebarItem = ({ to, icon: Icon, label, active, onClick }: any) => (
  <Link 
    to={to} 
    onClick={onClick} // ربط حدث الضغط
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${active ? 'bg-navy-800 text-gold-400' : 'text-white hover:bg-navy-800/50'}`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState(getSettings());
  const { isAuthenticated, logout, user, role } = useUi();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Apply Dark Mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleSettingsChange = () => {
        const newSettings = getSettings();
        setSettings(newSettings);
        if (newSettings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, [settings.darkMode]);

  // If not authenticated, render children directly
  if (!isAuthenticated) {
      return <>{children}</>;
  }

  // Define All Routes with Roles
  const allNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'الرئيسية (القيادة)', roles: ['admin'] },
    { to: '/institutions', icon: Building2, label: 'بيانات المؤسسة', roles: ['admin', 'user'] },
    { to: '/evaluation', icon: ClipboardCheck, label: 'التقييم', roles: ['admin', 'user'] },
    { to: '/compliance', icon: Scale, label: 'الامتثال النظامي', roles: ['admin', 'user'] },
    { to: '/reports', icon: FileBarChart, label: 'النتائج والتقارير', roles: ['admin'] },
    { to: '/improvements', icon: ShieldAlert, label: 'خطة التحسين', roles: ['admin', 'user'] },
    { to: '/settings', icon: Settings, label: 'إعدادات النظام', roles: ['admin'] },
  ];

  // Filter based on current role
  const navItems = allNavItems.filter(item => role && item.roles.includes(role));

  // 2. دالة الحماية (The Guard Function)
  const handleItemClick = (e: React.MouseEvent, path: string) => {
    // إذا كان الرابط هو التقييم، والمستخدم هو مؤسسة (وليس مدير)، نطبق الشرط
    if (path === '/evaluation' && role === 'user') {
        const isCompleted = localStorage.getItem('isProfileCompleted');
        
        if (isCompleted !== 'true') {
            e.preventDefault(); // منع الانتقال
            alert('عذراً، لا يمكن الدخول لصفحة التقييم قبل إكمال وحفظ "بيانات المؤسسة" أولاً.');
            
            // توجيه المستخدم لصفحة البيانات إجبارياً
            navigate('/institutions');
            
            // إغلاق القائمة في الموبايل إن كانت مفتوحة
            setSidebarOpen(false); 
        }
    }
    // في الحالات الأخرى، الانتقال سيحدث تلقائياً عبر Link
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans text-right" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-navy-900 dark:bg-black text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-navy-800 min-h-[5rem]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 min-w-[2.5rem] bg-white rounded-full p-1 overflow-hidden flex items-center justify-center shadow-md">
                 <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/5/52/Ministry_of_Endowments_and_Religious_Affairs_%28Oman%29_Logo.png" 
                    className="w-full h-full object-contain" 
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                 />
             </div>
             <div className="flex flex-col">
                 <h1 className="text-sm font-bold text-white leading-tight">نظام تقييم المؤسسات الوقفية</h1>
                 <span className="text-[10px] text-gray-400 mt-1 font-medium">وزارة الأوقاف والشؤون الدينية</span>
             </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* User Role Badge */}
        <div className="px-4 mt-4">
            <div className={`p-2 rounded-lg text-center text-xs font-bold border ${role === 'admin' ? 'bg-navy-800 border-navy-700 text-gold-400' : 'bg-teal-900/50 border-teal-800 text-teal-400'}`}>
                {role === 'admin' ? 'صلاحية: مدير نظام' : 'صلاحية: مؤسسة وقفية'}
            </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto mt-2">
          {navItems.map((item) => (
            <SidebarItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to}
                // 3. تمرير الدالة هنا
                onClick={(e: React.MouseEvent) => handleItemClick(e, item.to)}
            />
          ))}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-red-300 hover:bg-navy-800/50 mt-4"
          >
             <LogOut size={20} />
             <span className="font-medium">تسجيل الخروج</span>
          </button>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-navy-800 text-xs text-gray-400 text-center">
          <p>{settings.orgName}</p>
          <p className="mt-1 text-gold-500">تحت إشراف {settings.managerName}</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 border-b border-gray-200 dark:border-gray-700 h-20 flex items-center px-6 justify-between print:hidden">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 dark:text-gray-200">
                <Menu size={24} />
            </button>
            
            <div className="flex flex-col items-center flex-1 lg:flex-none lg:items-start">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">نظام تقييم المؤسسات الوقفية</h2>
                <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold hidden md:block">سلطنة عُمان - {settings.orgName}</span>
            </div>

            <div className="hidden md:flex items-center gap-4">
                <div className="text-left">
                   <p className="text-sm font-bold text-navy-900 dark:text-white">أهلاً، {user}</p>
                   <p className="text-xs text-gold-600 dark:text-gold-400">{role === 'admin' ? 'مدير النظام' : 'مستخدم مؤسسة'}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${role === 'admin' ? 'bg-navy-800' : 'bg-teal-600'}`}>
                    {user?.charAt(0).toUpperCase()}
                </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative dark:text-gray-100">
          {children}
          
          {/* Footer - Print Only */}
          <div className="hidden print:block fixed bottom-0 left-0 right-0 text-center p-4 border-t text-sm">
             <p>تم استخراج هذا التقرير آلياً من نظام تقييم المؤسسات الوقفية</p>
             <p className="font-bold">تحت إشراف {settings.managerName}</p>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default Layout;