import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const [ searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token')
        const userId = searchParams.get('userId')
        const error = searchParams.get('error');
   if(error){
    console.error('OAuth2 authentication error:', error);
    navigate('/login?error=oauth2_failed');
   }
   if ( token && userId){
    localStorage.setItem('token',token)
    localStorage.setItem('userId', userId)

      navigate('/chat');

   }
   else {
      // If no token or userId, redirect to login with error
      navigate('/');
    }
    },[navigate,searchParams])

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-12 rounded-3xl border border-white/10 shadow-2xl shadow-black/2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-light">Completing sign in...</p>
        </div>
      </div>
    </div>
  )
}

export default OAuth2RedirectHandler

