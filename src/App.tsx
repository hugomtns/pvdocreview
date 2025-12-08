import './App.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

function App() {
  const { currentUser, mockUsers, login, logout } = useAuthStore();

  return (
    <div className="app">
      <Card className="app__card">
        <CardHeader>
          <CardTitle>PV Document Review</CardTitle>
          <CardDescription>E1-S4: Testing Auth Store</CardDescription>
        </CardHeader>
        <CardContent className="app__content">
          {currentUser ? (
            <div className="app__user-info">
              <p className="app__user-label">Currently logged in as:</p>
              <p className="app__user-details">
                <strong>{currentUser.name}</strong> ({currentUser.role})
              </p>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          ) : (
            <div className="app__login">
              <p className="app__login-prompt">Select a user to login:</p>
              <div className="app__user-buttons">
                {mockUsers.map((user) => (
                  <Button
                    key={user.id}
                    onClick={() => login(user.id)}
                    variant="default"
                  >
                    {user.name}
                    <span className="app__role-badge">{user.role}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          <p className="app__instruction">
            Try logging in, refreshing the page, and logging out to test persistence.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
