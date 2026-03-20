import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Award, ArrowLeft, Phone, Mail, MessageCircle } from 'lucide-react';

const WOLMERS_LOGO = "https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png";

export default function ServiceSelection() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50" data-testid="service-selection-page">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/student" className="flex items-center gap-2 text-stone-600 hover:text-maroon-500">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-3">
            What would you like to request?
          </h1>
          <p className="text-stone-600 max-w-xl mx-auto">
            Welcome, {user?.full_name?.split(' ')[0]}! Please select the type of document you need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
          {/* Transcript Request Card */}
          <Link to="/student/new-request" className="block group">
            <Card className="h-full border-2 border-transparent hover:border-maroon-500 transition-all duration-200 hover:shadow-lg">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-maroon-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-maroon-200 transition-colors">
                  <FileText className="h-8 w-8 text-maroon-600" />
                </div>
                <CardTitle className="font-heading text-xl text-stone-900">
                  Academic Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-stone-600 mb-6">
                  Request an official copy of your academic records including grades, courses taken, and GPA.
                </CardDescription>
                <Button
                  className="bg-maroon-500 hover:bg-maroon-600 text-white w-full"
                  data-testid="transcript-request-btn"
                >
                  Request Transcript
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Recommendation Letter Card */}
          <Link to="/student/new-recommendation" className="block group">
            <Card className="h-full border-2 border-transparent hover:border-gold-500 transition-all duration-200 hover:shadow-lg">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-200 transition-colors">
                  <Award className="h-8 w-8 text-gold-600" />
                </div>
                <CardTitle className="font-heading text-xl text-stone-900">
                  Recommendation Letter
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-stone-600 mb-6">
                  Request a letter of recommendation for university applications or employment opportunities.
                </CardDescription>
                <Button
                  className="bg-gold-500 hover:bg-gold-600 text-stone-900 w-full"
                  data-testid="recommendation-request-btn"
                >
                  Request Recommendation
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Helpful Information Panel */}
        <div className="max-w-3xl mx-auto">
          <Card className="border border-stone-200 shadow-sm bg-white">
            <CardHeader className="pb-2 border-b border-stone-100">
              <CardTitle className="font-heading text-lg text-stone-700 text-center">Helpful Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Logo */}
                <img
                  src={WOLMERS_LOGO}
                  alt="Wolmer's Boys' School Crest"
                  className="w-20 h-20 object-contain"
                />

                {/* School Name */}
                <p className="font-heading font-bold text-stone-900 text-lg tracking-wide">
                  WOLMER'S BOYS' SCHOOL
                </p>

                {/* Address */}
                <p className="text-stone-600 text-sm">
                  National Heroes Circle, Kingston 4
                </p>

                {/* Bursary contacts */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-sm text-stone-600">
                    <Phone className="h-3.5 w-3.5 text-maroon-500 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-stone-700">Bursary:</span>{' '}
                      876 922 4055 / 876 948 4807
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-stone-600">
                    <MessageCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-stone-700">WhatsApp:</span>{' '}
                      876 313 0915
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-stone-600">
                    <Mail className="h-3.5 w-3.5 text-maroon-500 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-stone-700">Email:</span>{' '}
                      wbs.bursary@wolmers.org / iyona.forbes@wolmers.org
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-32 border-t border-stone-200" />

                {/* Guidance Department */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-sm text-stone-600">
                    <Phone className="h-3.5 w-3.5 text-maroon-500 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-stone-700">Guidance Department:</span>{' '}
                      876 922 8254
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-stone-600">
                    <Mail className="h-3.5 w-3.5 text-maroon-500 flex-shrink-0" />
                    <span>
                      <span className="font-medium text-stone-700">Email:</span>{' '}
                      wbs.guidance@wolmers.org
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
