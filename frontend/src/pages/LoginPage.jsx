import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { loginWithRedirect } from '@/lib/msalConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react';

const WOLMERS_LOGO = "https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png";
const BACKGROUND_IMAGE = "https://www.wolmers.org/trust/wp-content/uploads/2019/05/1207549.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [loginType, setLoginType] = useState('student');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.full_name}!`);
      
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'staff') navigate('/staff');
      else if (user.role === 'admin') navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setMsLoading(true);
    try {
      // This will redirect to Microsoft login
      await loginWithRedirect();
      // The page will redirect, so we don't need to handle anything after this
    } catch (error) {
      console.error('Microsoft login error:', error);
      toast.error('Failed to start Microsoft login');
      setMsLoading(false);
    }
  };

  const googleFormUrl = 'https://forms.gle/yCDU5p3EJ6X6yv7T9';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="login-page">
      {/* Left side - Image/Branding (hidden on mobile, shown on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${BACKGROUND_IMAGE}")` }}
        />
        <div className="absolute inset-0 bg-maroon-900/85" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <img 
              src={WOLMERS_LOGO}
              alt="Wolmer's Boys' School"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold">Wolmer's Boys' School</h1>
              <p className="text-gold-400 text-sm">Est. 1729</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <blockquote className="text-2xl font-light italic">
              "Age Quod Agis: Whatever you do, do it to the best of your ability"
            </blockquote>
            <p className="text-gold-400 font-medium">School Motto</p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-stone-50 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Mobile header with background */}
          <div className="lg:hidden">
            <div className="flex flex-col items-center gap-3 mb-6 p-4 bg-maroon-900 rounded-lg -mx-4 sm:mx-0 sm:rounded-lg">
              <img 
                src={WOLMERS_LOGO}
                alt="Wolmer's Boys' School"
                className="h-16 w-16 object-contain"
              />
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">Wolmer's Boys' School</h1>
                <p className="text-gold-400 text-sm">Transcript & Recommendation Tracker</p>
              </div>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Welcome back</h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600">Sign in to access your transcript requests</p>
          </div>

          {/* Login Type Toggle */}
          <div className="flex rounded-lg bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setLoginType('student')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'student' 
                  ? 'bg-white text-maroon-900 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              data-testid="student-login-toggle"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setLoginType('staff')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'staff' 
                  ? 'bg-white text-maroon-900 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              data-testid="staff-login-toggle"
            >
              Staff / Admin
            </button>
          </div>

          {loginType === 'student' ? (
            /* Student Login - Microsoft 365 */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Students must sign in using their official Wolmer's Microsoft 365 account (@wolmers.org).
                </p>
              </div>

              <Button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={msLoading}
                className="w-full h-12 bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white"
                data-testid="microsoft-login-button"
              >
                {msLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redirecting to Microsoft...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="none">
                      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                    </svg>
                    Sign in with Microsoft 365
                  </>
                )}
              </Button>

              {/* Highlighted Help Section */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-center">
                <p className="text-amber-800 font-medium mb-2">
                  Don't have a Wolmer's email?
                </p>
                <a
                  href={googleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-base text-maroon-700 hover:text-maroon-800 font-semibold underline decoration-2"
                >
                  Request access here
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          ) : (
            /* Staff/Admin Login */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-stone-700">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@wolmers.org"
                    required
                    className="mt-1"
                    data-testid="email-input"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-stone-700">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-maroon-600 hover:text-maroon-700">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="pr-10"
                      data-testid="password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-maroon-600 hover:bg-maroon-700"
                data-testid="login-submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <p className="text-center text-sm text-stone-600">
                Staff and admin accounts are created by administrators.
              </p>
            </form>
          )}

          <div className="text-center pt-4 border-t border-stone-200">
            <Link to="/" className="text-sm text-stone-600 hover:text-stone-900">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
