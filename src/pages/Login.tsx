import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
    const navigate = useNavigate()
   const [username, setUsername] = useState('');

    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

const handleSignup =() =>{
    navigate('/sign-up')
}


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', {
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
        <div className="flex items-center justify-center min-h-screen bg-blue-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm"
            >
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

                {error && (
                    <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
                )}

                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                        Username
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className='mt-3 text-sm'>
                <h3>Don't have an account ? <a onClick={handleSignup} className='text-blue-400 font-medium underline cursor-pointer'>Sign-Up</a></h3>
                </div>

                <button
                    type="submit"
                    className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md transition"
                >
                    Sign In
                </button>
            </form>
        </div>
    )
}
