import './App.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function App() {
  return (
    <div className="app">
      <Card className="app__card">
        <CardHeader>
          <CardTitle>PV Document Review</CardTitle>
          <CardDescription>Testing shadcn/ui components</CardDescription>
        </CardHeader>
        <CardContent className="app__content">
          <div className="app__form-group">
            <Label htmlFor="test-input">Test Input</Label>
            <Input id="test-input" placeholder="Enter text..." />
          </div>
          <Button>Test Button</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
