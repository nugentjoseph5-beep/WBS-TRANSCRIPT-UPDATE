import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, Users, Shield, ArrowRight, Award } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <div className="relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 h-[600px] bg-cover bg-center"
          style={{
            backgroundImage: `url('https://customer-assets.emergentagent.com/job_wbs-transcripts/artifacts/wneuo6w3_Wolmers-Boys-High-School.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-maroon-500/90 via-maroon-500/80 to-maroon-900/95"></div>
        </div>

        {/* Header */}
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img 
                  src="https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png" 
                  alt="Wolmer's Boys' School Crest" 
                  className="w-14 h-14 object-contain"
                />
                <div>
                  <h1 className="font-heading text-white text-xl font-semibold">Wolmer's Boys' School</h1>
                  <p className="text-gold-400 text-sm">Est. 1729</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/login" className="text-white/90 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/register">
                  <Button className="bg-gold-500 text-maroon-900 hover:bg-gold-400 font-medium">
                    Register
                  </Button>
                </Link>
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Link to="/login">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold-500/20 text-gold-400 text-sm font-medium mb-6">
              WBS Transcript & Recommendation Tracker
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-tight mb-6">
              Request Transcripts & Recommendation Letters Online
            </h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              A streamlined system for current students, graduates, and alumni to request and track 
              their academic transcripts and recommendation letters from Wolmer's Boys' School.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-gold-500 text-maroon-900 hover:bg-gold-400 font-semibold px-8 h-12">
                  Login
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-12">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="font-heading text-3xl md:text-4xl text-stone-900 font-bold mb-4">
              How It Works
            </h3>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">
              Our system is designed to make requesting transcripts and recommendation letters simple and transparent.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-stone-200 card-hover">
              <div className="w-14 h-14 rounded-lg bg-maroon-500/10 flex items-center justify-center mb-6">
                <FileText className="h-7 w-7 text-maroon-500" />
              </div>
              <h4 className="font-heading text-xl font-semibold text-stone-900 mb-3">
                Request Transcript
              </h4>
              <p className="text-stone-600 leading-relaxed">
                Fill out the online transcript request form with your details and specify your delivery preference.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-stone-200 card-hover">
              <div className="w-14 h-14 rounded-lg bg-gold-500/20 flex items-center justify-center mb-6">
                <Award className="h-7 w-7 text-gold-600" />
              </div>
              <h4 className="font-heading text-xl font-semibold text-stone-900 mb-3">
                Request Recommendation
              </h4>
              <p className="text-stone-600 leading-relaxed">
                Submit a recommendation letter request for university applications or employment.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-stone-200 card-hover">
              <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h4 className="font-heading text-xl font-semibold text-stone-900 mb-3">
                Track Progress
              </h4>
              <p className="text-stone-600 leading-relaxed">
                Monitor your request status in real-time with our timeline view. Receive notifications at every step.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-stone-200 card-hover">
              <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-green-600" />
              </div>
              <h4 className="font-heading text-xl font-semibold text-stone-900 mb-3">
                Flexible Collection
              </h4>
              <p className="text-stone-600 leading-relaxed">
                Choose your preferred collection method: pickup from school, email directly to institution, or courier delivery service via DHL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Access Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="font-heading text-3xl md:text-4xl text-stone-900 font-bold mb-4">
              Portal Access
            </h3>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">
              Different portals for students, staff, and administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Student Portal */}
            <div className="border-2 border-stone-200 rounded-lg p-8 hover:border-maroon-500 transition-colors">
              <div className="w-12 h-12 rounded-full bg-maroon-500 text-white flex items-center justify-center mb-4">
                <span className="font-heading font-bold text-lg">S</span>
              </div>
              <h4 className="font-heading text-xl font-semibold text-stone-900 mb-2">Student Portal</h4>
              <p className="text-stone-600 text-sm mb-4">Request transcripts and recommendation letters, track status, and manage notifications.</p>
              <Link to="/register">
                <Button variant="outline" className="w-full border-maroon-500 text-maroon-500 hover:bg-maroon-500 hover:text-white">
                  Register as Student
                </Button>
              </Link>
            </div>

            {/* Staff Portal */}
            <div className="border-2 border-stone-200 rounded-lg p-8 hover:border-gold-500 transition-colors">
              <div className="w-12 h-12 rounded-full bg-gold-500 text-maroon-900 flex items-center justify-center mb-4">
                <span className="font-heading font-bold text-lg">S</span>
              </div>
              <h4 className="font-heading text-xl font-semibold text-stone-900 mb-2">Staff Portal</h4>
              <p className="text-stone-600 text-sm mb-4">Process assigned requests, update status, and upload documents.</p>
              <Link to="/login">
                <Button variant="outline" className="w-full border-gold-600 text-gold-700 hover:bg-gold-500 hover:text-maroon-900">
                  Staff Login
                </Button>
              </Link>
            </div>

            {/* Admin Portal */}
            <div className="border-2 border-stone-200 rounded-lg p-8 hover:border-stone-900 transition-colors">
              <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center mb-4">
                <span className="font-heading font-bold text-lg">A</span>
              </div>
              <h4 className="font-heading text-xl font-semibold text-stone-900 mb-2">Admin Portal</h4>
              <p className="text-stone-600 text-sm mb-4">Full access to analytics, user management, and system controls.</p>
              <Link to="/login">
                <Button variant="outline" className="w-full border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white">
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png" 
                alt="Wolmer's Boys' School Crest" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h4 className="font-heading font-semibold">Wolmer's Boys' School</h4>
                <p className="text-stone-400 text-sm">Transcript & Recommendation Tracker</p>
              </div>
            </div>
            <p className="text-stone-400 text-sm">
              © {new Date().getFullYear()} Wolmer's Boys' School. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
