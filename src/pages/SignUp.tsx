import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const handleSignup = () => {
        navigate('/')
    }
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                username,
                password,
                email
            })
            console.log(response.data)
            console.log('User ID:', response.data.userId);
            console.log('Token:', response.data.token);

            localStorage.setItem('token', response.data.token)
            localStorage.setItem('userId', response.data.userId)
            navigate('/')
        } catch (err) {
            setError('Invalid credentials')
        }
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="bg-white/10 backdrop-blur-md p-12 rounded-3xl border border-white/10 shadow-2xl shadow-black/2 w-full max-w-md"
            >
                <h2 className="text-3xl font-light mb-8 text-center text-gray-800 tracking-wide">Sign Up</h2>

                {error && (
                    <div className="mb-6 text-red-400 text-sm text-center bg-red-50/50 py-2 px-4 rounded-xl border border-red-100/50">{error}</div>
                )}

                <div className="mb-6">
                    <label className="block mb-3 text-sm font-light text-gray-600 tracking-wide">
                        Username
                    </label>
                    <input
                        placeholder="Enter your username"
                        type="text"
                        className="w-full px-4 py-4 bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-8">
                    <label className="block mb-3 text-sm font-light text-gray-600 tracking-wide">
                        Email
                    </label>
                    <input
                        placeholder="example@gmail.com"
                        type="email"
                        className="w-full px-4 py-4 bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-8">
                    <label className="block mb-3 text-sm font-light text-gray-600 tracking-wide">
                        Password
                    </label>
                    <input
                        placeholder="Enter your password"
                        type="password"
                        className="w-full px-4 py-4 bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-transparent transition-all duration-300 text-gray-700 placeholder-gray-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>


                <div className='mb-6 text-sm'>
                    <h3 className="text-gray-500 font-light">Already have an account? <a onClick={handleSignup} className='text-gray-700 font-normal hover:text-gray-900 transition-colors cursor-pointer border-b border-gray-300 hover:border-gray-700'>Log In</a></h3>
                </div>

                <button
                    type="submit"
                    className="w-full bg-gray-900/90 hover:bg-gray-900 backdrop-blur-sm text-white font-light py-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20 tracking-wide"
                >
                    Sign Up
                </button>
            </form>
        </div>
    )
}

export default SignUp