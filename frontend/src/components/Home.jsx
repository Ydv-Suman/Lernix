import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-[#669694]/50 shadow-sm">
        <div className="w-full px-4 sm:px-3 lg:px-4">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-8">
              <h1 className="text-4xl font-bold text-gray-900"><Link to="/home">Lernix</Link></h1>
              <div className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                <div><Link to="/home">Courses</Link></div>
                <div><Link to="/home">Notes</Link></div>
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8 bg-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <p className="text-gray-600">
                  <span className="font-semibold">User ID:</span> {user?.id}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Email:</span> {user?.email}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Username:</span> {user?.username}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
