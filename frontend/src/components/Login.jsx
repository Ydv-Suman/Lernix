import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/courses');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(to_right,white_50%,#669694_50%)]">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row">
                    {/* Left Side */}
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-[#2D5F5D]">Lernix</h1>
                        <p className="text-lg md:text-xl text-gray-600 mt-4 text-center">AI based learning platform for students</p>
                    </div>
                    

                    {/* Right Side */}
                    <div className="bg-[#2D5F5D] w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center">
                        <div className="w-full max-w-md">
                            <h1 className="text-3xl md:text-5xl text-center font-bold text-white mb-16">Login</h1>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-12 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-70 hover:opacity-100 focus:outline-none transition-opacity"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#FF6B35]/80 text-white py-3 rounded-lg font-semibold text-lg hover:bg-[#E55A2B] transition-colors cursor-pointer"
                                >
                                    Log in
                                </button>
                            </form>
                            
                            <div className="text-center mt-2">
                                <a href="#" className="text-[#FF6B35] hover:underline">
                                    Forget password?
                                </a>
                            </div>

                            <div className="text-center mt-6">
                                <p className="text-[white]">Don't have a account? <Link to="/register" className="text-[#FF6B35] font-bold hover:underline">
                                    Create Account
                                </Link></p>
                                
                            </div>

                        </div>
                    </div>
                </div>
            </div>
  );
};

export default Login;
