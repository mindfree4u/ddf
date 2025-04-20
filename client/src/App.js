// client/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import Login from './components/Login';
import Signup from './components/Signup';
import MainMenu from './components/MainMenu';
import AuthNav from './components/AuthNav';
import ReservationForm from './components/ReservationForm';
import Introduction from './components/Introduction';
import VideoUpload from './components/VideoUpload';
import Board from './components/Board';
import MyPage from './components/MyPage';
import MainPage from './components/MainPage';
import PostDetail from './components/PostDetail';
import Footer from './components/Footer';
import Location from './components/Location';
import './App.css';

function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const auth = getAuth();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? (
    <div className="app-layout">
      <MainMenu />
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  ) : (
    <Navigate to="/login" />
  );
}

function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <AuthNav />
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  );
}

// 레이아웃 컴포넌트 생성
function Layout({ children }) {
  return (
    <>
      <MainMenu />
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/main" 
            element={
              <Layout>
                <MainPage />
              </Layout>
            } 
          />
          <Route 
            path="/introduction" 
            element={
              <Layout>
                <Introduction />
              </Layout>
            } 
          />
          <Route
            path="/reservation"
            element={
              <PrivateRoute>
                <Layout>
                  <ReservationForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route 
            path="/video-upload" 
            element={
              <Layout>
                <VideoUpload />
              </Layout>
            } 
          />
          <Route 
            path="/board" 
            element={
              <Layout>
                <Board />
              </Layout>
            } 
          />
          <Route 
            path="/board/post/:id" 
            element={
              <Layout>
                <PostDetail />
              </Layout>
            } 
          />
          <Route 
            path="/my-page" 
            element={
              <Layout>
                <MyPage />
              </Layout>
            } 
          />
          <Route 
            path="/location" 
            element={
              <Layout>
                <Location />
              </Layout>
            } 
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;