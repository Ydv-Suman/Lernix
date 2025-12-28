import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Courses from './components/course/Courses';
import Chapters from './components/course/chapters';
import Summarize from './components/course/chapters/Summarize';
import AskQuestions from './components/course/chapters/ask-questions';
import CreateMcq from './components/course/chapters/create-mcq';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/chapters"
            element={
              <ProtectedRoute>
                <Chapters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/chapters/:chapterId/summarize"
            element={
              <ProtectedRoute>
                <Summarize />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/chapters/:chapterId/ask-question"
            element={
              <ProtectedRoute>
                <AskQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/chapters/:chapterId/create-mcq"
            element={
              <ProtectedRoute>
                <CreateMcq />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/courses" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
