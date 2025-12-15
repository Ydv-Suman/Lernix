import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    mid_init: '',
    last_name: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [formattedPhone, setFormattedPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Format phone number: +_(___)___ - ____
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format: +_(___)___ - ____
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 10) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)} - ${digits.slice(7)}`;
    // Limit to 11 digits total (1 country code + 10 digits)
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)} - ${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    // Extract only digits from the input
    const digits = inputValue.replace(/\D/g, '');
    // Format the digits
    const formatted = formatPhoneNumber(digits);
    setFormattedPhone(formatted);
    
    // Store only digits in formData (limit to 11 digits)
    setFormData({
      ...formData,
      phone_number: digits.slice(0, 11)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Limit middle initial to 1 character
    if (name === 'mid_init') {
      setFormData({
        ...formData,
        [name]: value.toUpperCase().slice(0, 1)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
    // Convert empty mid_init to null
    if (userData.mid_init === '') {
      userData.mid_init = null;
    }
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
                <div className="w-20">
                  <input
                    type="text"
                    name="mid_init"
                    placeholder="M.I."
                    value={formData.mid_init}
                    onChange={handleChange}
                    maxLength={1}
                    className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors text-center"
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
                  placeholder="+_ (___) ___ - ____"
                  value={formattedPhone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-3 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
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

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 bg-transparent border border-[#2D5F5D] border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:border-[#FF6B35] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-70 hover:opacity-100 focus:outline-none transition-opacity"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
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
