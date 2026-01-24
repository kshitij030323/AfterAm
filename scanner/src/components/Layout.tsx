import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, QrCode, LogOut } from 'lucide-react';
import { useAuth } from '../App';

export function Layout({ children }: { children: ReactNode }) {
    const { club, logout } = useAuth();

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src="/clubin-logo.png" alt="Clubin" className="sidebar-logo-img" style={{ height: '56px', width: 'auto' }} />
                </div>

                <ul className="nav-links">
                    <li>
                        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                            <LayoutDashboard size={20} /> Events
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/scan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <QrCode size={20} /> Scan Entry
                        </NavLink>
                    </li>
                </ul>

                <div className="sidebar-footer">
                    <div className="club-info">
                        {club?.imageUrl && <img src={club.imageUrl} alt={club.name} className="club-avatar" />}
                        <div>
                            <div className="club-name">{club?.name}</div>
                            <div className="club-location">{club?.location}</div>
                        </div>
                    </div>
                    <button onClick={logout} className="logout-btn">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
