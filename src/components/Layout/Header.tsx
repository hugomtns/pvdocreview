import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import './Header.css';

export function Header() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__brand">
          <h1 className="header__title">PV Document Review</h1>
        </div>

        <div className="header__user">
          <div className="header__user-info">
            <span className="header__user-name">{currentUser.name}</span>
            <span className={`header__role-badge header__role-badge--${currentUser.role}`}>
              {currentUser.role}
            </span>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
