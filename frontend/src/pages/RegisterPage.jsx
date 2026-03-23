import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loginWithRedirect } from '@/lib/msalConfig';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ExternalLink, CheckCircle } from 'lucide-react';

const WOLMERS_LOGO = "https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png";
const BACKGROUND_IMAGE = "https://www.wolmers.org/trust/wp-content/uploads/2019/05/1207549.jpg";

export default function RegisterPage() {
  const [msLoading, setMsLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    setMsLoading(true);
    try {
      await loginWithRedirect();
    } catch (error) {
      console.error('Microsoft login error:', error);
      toast.error('Failed to start Microsoft login');
      setMsLoading(false);
    }
  };

  const googleFormUrl = 'https://forms.gle/yCDU5p3EJ6X6yv7T9';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" data-testid="register-page">
      {/* Left side - Image/Branding (hidden on mobile) */}
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
            <p className="text-gold-400 font-medium">Wolmer's Motto</p>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
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
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Student Registration</h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600">Create your account using your Wolmer's Microsoft 365 credentials</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
            <p className="text-sm text-blue-800 font-medium">
              Registration is only available for students with a @wolmers.org email address.
            </p>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Use your official Wolmer's Microsoft 365 account</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Your account will be automatically created on first sign-in</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Staff and admin accounts are created by administrators</span>
              </li>
            </ul>
          </div>

          {/* Microsoft Sign In Button */}
          <Button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={msLoading}
            className="w-full h-12 bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white"
            data-testid="microsoft-register-button"
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

          {/* Login Link - Highlighted */}
          <div className="bg-stone-100 border-2 border-stone-300 rounded-lg p-4 text-center">
            <p className="text-stone-800 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-maroon-700 hover:text-maroon-800 font-semibold underline decoration-2">
                Sign in
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link to="/" className="text-sm text-stone-500 hover:text-stone-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
