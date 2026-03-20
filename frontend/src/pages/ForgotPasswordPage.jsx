import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Mail, CheckCircle, AlertTriangle, Copy, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState(null); // For dev mode when email not configured

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      setSubmitted(true);
      
      // If token is returned (dev mode - email not configured), show the reset link
      if (response.data?.token) {
        const link = `${window.location.origin}/reset-password?token=${response.data.token}`;
        setResetLink(link);
        toast.success('Reset link generated (email service not configured)');
      } else {
        toast.success('Password reset instructions sent!');
      }
    } catch (error) {
      // Still show success for security (don't reveal if email exists)
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const copyResetLink = () => {
    navigator.clipboard.writeText(resetLink);
    toast.success('Reset link copied to clipboard!');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Image */}
      <div 
        className="hidden lg:flex flex-col justify-between p-12 relative"
        style={{
          backgroundImage: `url('https://customer-assets.emergentagent.com/job_wbs-transcripts/artifacts/wneuo6w3_Wolmers-Boys-High-School.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-maroon-500/90 to-maroon-900/95"></div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png" 
              alt="Wolmer's Boys' School Crest" 
              className="w-14 h-14 object-contain"
            />
            <div>
              <h1 className="font-heading text-white text-xl font-semibold">Wolmer's Boys' School</h1>
              <p className="text-gold-400 text-sm">Est. 1729</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <blockquote className="text-xl text-white/90 font-light leading-relaxed mb-4">
            "Age Quod Agis: Whatever you do, do it to the best of your ability"
          </blockquote>
          <p className="text-gold-400 text-sm">School Motto</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png" 
                alt="Wolmer's Boys' School Crest" 
                className="w-12 h-12 object-contain"
              />
              <div className="text-left">
                <h1 className="font-heading text-stone-900 text-lg font-semibold">Wolmer's Boys' School</h1>
                <p className="text-stone-500 text-sm">Transcript Tracker</p>
              </div>
            </Link>
          </div>

          {!submitted ? (
            <>
              <div>
                <Link to="/login" className="inline-flex items-center text-sm text-stone-500 hover:text-maroon-500 mb-6">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to login
                </Link>
                <h2 className="font-heading text-3xl font-bold text-stone-900 mb-2">Forgot password?</h2>
                <p className="text-stone-600">Enter your email and we'll send you a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" data-testid="forgot-password-form">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 focus:ring-maroon-500"
                    data-testid="forgot-email-input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-maroon-500 hover:bg-maroon-600 text-white font-medium"
                  data-testid="forgot-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-stone-900 mb-2">
                {resetLink ? 'Reset Link Generated' : 'Check your email'}
              </h2>
              <p className="text-stone-600 mb-6">
                {resetLink ? (
                  <>Use the link below to reset your password for <strong>{email}</strong></>
                ) : (
                  <>If an account with <strong>{email}</strong> exists, we've sent you a link to reset your password.</>
                )}
              </p>
              
              {/* Show reset link in dev mode (when email service not configured) */}
              {resetLink && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Development Mode</p>
                      <p className="text-xs text-amber-700">Email service is not configured. Use this link to reset your password:</p>
                    </div>
                  </div>
                  <div className="bg-white rounded border border-amber-200 p-2 mb-3">
                    <p className="text-xs text-stone-600 break-all font-mono">{resetLink}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyResetLink}
                      className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                    <Link to={`/reset-password?token=${resetLink.split('token=')[1]}`} className="flex-1">
                      <Button
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open Link
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {!resetLink && (
                <p className="text-sm text-stone-500 mb-8">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              )}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setResetLink(null);
                  }}
                  className="w-full"
                >
                  Try another email
                </Button>
                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full text-maroon-500 hover:text-maroon-600">
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
