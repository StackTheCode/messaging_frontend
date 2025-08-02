import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ChatbotApp from './ChatbotApp.tsx'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.tsx'
const isAuthenticated = () => {
  return !!localStorage.getItem('token'); // simple check
};
window.global = window;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path='/chat'
      element={isAuthenticated() ? <ChatbotApp/> : <Navigate to="/"/>} />
      </Routes>

    </BrowserRouter>
    <ChatbotApp />
  </StrictMode>,
)
