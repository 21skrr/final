import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Router from './router';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router />
          <Toaster />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;