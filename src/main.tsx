import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ChatbotApp from './ChatbotApp.tsx'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.tsx'
import SignUp from './pages/SignUp.tsx'
const isAuthenticated = () => {
  return !!localStorage.getItem('token'); // simple check
};
window.global = window;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/sign-up" element={<SignUp/>}/>
        <Route path="/chat"
      element={isAuthenticated() ? <ChatbotApp/> : <Navigate to="/"/>} />
      </Routes>

    </BrowserRouter>
 
  </StrictMode>,
)
