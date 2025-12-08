import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      navigate('/home');
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

                                <div>
                                    <input
                                        type="password"
                                        id="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                                        required
                                    />
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
