import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { mockUsers, login } = useAuthStore();

  const handleLogin = (userId: string) => {
    login(userId);
    navigate('/documents');
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__header">
          <h1 className="login-page__title">PV Document Review</h1>
          <p className="login-page__subtitle">Select your role to continue</p>
        </div>

        <div className="login-page__cards">
          {mockUsers.map((user) => (
            <Card
              key={user.id}
              className="login-page__card"
              onClick={() => handleLogin(user.id)}
            >
              <CardHeader>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>
                  <span className={`login-page__role-badge login-page__role-badge--${user.role}`}>
                    {user.role}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="login-page__card-instruction">Click to login as {user.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
