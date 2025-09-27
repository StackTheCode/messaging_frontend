import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react';

import axios from 'axios'
import GoogleButton from '../components/GoogleButton';

export default function Login() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('')


    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam === 'oauth2_error') {
            setError('Google sign-in failed. Please try again.');
        } else if (errorParam === 'oauth2_failed') {
            setError('Authentication failed. Please try again.');
        }
    }, [searchParams]);

    const handleSignup = () => {
        navigate('/sign-up')
    }


    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                username,
                password,
            })
            console.log(response.data)
            console.log('User ID:', response.data.userId);
            console.log('Token:', response.data.token);

            localStorage.setItem('token', response.data.token)
            localStorage.setItem('userId', response.data.userId)
            navigate('/chat')
        } catch (err) {
            setError('Invalid credentials')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-md p-12 rounded-3xl border border-white/10 shadow-2xl shadow-black/2 w-full max-w-md">
                <h2 className="text-3xl font-light mb-8 text-center text-gray-800 tracking-wide">Login</h2>

                {error && (
                    <div className="mb-6 text-red-400 text-sm text-center bg-red-50/50 py-3 px-4 rounded-xl border border-red-100/50 animate-pulse">
                        {error}
                    </div>
                )}
                <GoogleButton text="Sign in with Google" />

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white/10 text-gray-500 font-light">or continue with email</span>
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block mb-3 text-sm font-light text-gray-600 tracking-wide">
                        Username
                    </label>
                    <input
                        placeholder="Enter your username"
                        type="text"
                        className="w-full px-4 py-4 bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 hover:bg-white/70"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-8">
                    <label className="block mb-3 text-sm font-light text-gray-600 tracking-wide">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            className="w-full px-4 py-4 pr-12 bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400 hover:bg-white/70"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-lg hover:bg-white/30"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <Eye className="w-5 h-5" />

                            ) : (
                                <EyeOff className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="mb-6 text-sm">
                    <h3 className="text-gray-500 font-light">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={handleSignup}
                            className="text-gray-700 font-normal hover:text-gray-900 transition-colors cursor-pointer border-b border-gray-300 hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300/50 rounded-sm"
                        >
                            Sign Up
                        </button>
                    </h3>
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full bg-gray-900/90 hover:bg-gray-900 backdrop-blur-sm
                     text-white font-light py-4 rounded-2xl transition-all duration-300
                      hover:shadow-lg hover:shadow-gray-900/20 tracking-wide transform hover:scale-[1.02]
                       active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-900/50 focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer"
                >
                    Sign In
                </button>
            </div>
        </div>
    )
}
