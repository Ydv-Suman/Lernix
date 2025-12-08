import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);

    if (result.success) {
      navigate('/login');
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
            <h1 className="text-3xl md:text-5xl text-center font-bold text-white mb-8">Create Account</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  required
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                    required
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="Phone number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF6B35]/80 text-white py-3 rounded-lg font-semibold text-lg hover:bg-[#E55A2B] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-white">Already have an account? <Link to="/login" className="text-[#FF6B35] font-bold hover:underline">
                Login
              </Link></p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
