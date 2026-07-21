import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    try {
      const name = `${firstName} ${lastName}`.trim();
      // Assuming you have a register endpoint. If not, this is UI only for now.
      await axios.post('http://localhost:5000/api/register', { 
        name, 
        email, 
        password,
        role 
      });
      
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create account. Make sure the backend supports /api/register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50/30 font-sans text-gray-900 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-lg border border-gray-100 w-full max-w-xl relative overflow-hidden">
        
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-red-600"></div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-red-600 tracking-wide uppercase mb-6">Appeal Tracking Dashboard</h2>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2 text-sm">Fill in the details below to register a new account.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm border border-red-200 shadow-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-md mb-6 text-sm border border-emerald-200 shadow-sm flex items-center gap-2">
            {success}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">First Name</label>
              <input 
                type="text" 
                required 
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 bg-gray-50/50 transition-shadow" 
                value={firstName} 
                onChange={e => setFirstName(e.target.value)} 
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Last Name</label>
              <input 
                type="text" 
                required 
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 bg-gray-50/50 transition-shadow" 
                value={lastName} 
                onChange={e => setLastName(e.target.value)} 
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 bg-gray-50/50 transition-shadow" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Role</label>
              <select 
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 bg-gray-50/50 transition-shadow"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="Staff">Staff</option>
                <option value="Manajemen">Manajemen</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Create Password</label>
              <input 
                type="password" 
                required 
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 bg-gray-50/50 transition-shadow" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">Confirm Password</label>
              <input 
                type="password" 
                required 
                className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900 bg-gray-50/50 transition-shadow" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#E32636] text-white py-3 rounded-md font-bold text-base hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-6"
          >
            {loading ? 'Processing...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-red-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
