import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function Login({ setAuth }: { setAuth: (auth: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      
      const authData = {
        token: res.data.token,
        role: res.data.role,
        name: res.data.name
      };
      
      localStorage.setItem('auth', JSON.stringify(authData));
      setAuth(authData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-gray-900">
      {/* Left side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gray-900">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          alt="Office Building" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-red-900/20 mix-blend-multiply"></div>
      </div>

      {/* Right side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="bg-red-50 text-red-600 p-3 rounded-full mb-4 inline-block shadow-sm">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-2 tracking-tight">ADMIN LOGIN</h1>
            <p className="text-gray-500 font-medium">Welcome back! Please login to your account.</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm border border-red-200 shadow-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 bg-white transition-shadow" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Password</label>
              <input 
                type="password" 
                required 
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 bg-white transition-shadow" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                <span className="text-gray-600 font-medium group-hover:text-gray-800 transition-colors">Remember Me</span>
              </label>
              <a href="#" className="text-red-600 font-semibold hover:text-red-700 hover:underline transition-colors">Forgot Password?</a>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#E32636] text-white py-3 rounded-md font-bold text-base hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-4"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account? <Link to="/register" className="text-red-600 font-semibold hover:underline">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
