import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#669694]/50 shadow-sm">
      <div className="w-full px-4 sm:px-3 lg:px-4">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-8">
            <h1 className="text-4xl font-bold text-gray-900">
              <Link to="/courses">Lernix</Link>
            </h1>
            <div className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <div><Link to="/courses">Courses</Link></div>
              <div><Link to="/#">Notes</Link></div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.username || user?.email}!</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div> 
      </div>
    </nav>
  );
};

export default NavBar;
