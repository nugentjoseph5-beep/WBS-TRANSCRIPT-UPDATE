import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { recommendationAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate, getStatusBadgeClass } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  ArrowLeft, Award, User, Mail, Phone, MapPin, 
  Building, Calendar, Clock, FileText, Edit, Download
} from 'lucide-react';

export default function RecommendationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await recommendationAPI.getById(id);
      setRequest(res.data);
    } catch (error) {
      toast.error('Failed to load request details');
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (doc) => {
    try {
      const res = await recommendationAPI.getDocument(doc.id);
      const binaryString = atob(res.data.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: res.data.content_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-900">Request not found</h2>
          <Link to="/student" className="text-gold-500 hover:underline mt-2 block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="recommendation-detail-page">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/student" className="flex items-center gap-2 text-stone-600 hover:text-gold-500">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            {(request.status === 'Pending' || request.status === 'In Progress') && (
              <Link to={`/student/recommendation/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Request
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-gold-600" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-stone-900">
                Recommendation Letter Request
              </h1>
              <p className="text-stone-500">Submitted {formatDate(request.created_at)}</p>
            </div>
          </div>
          <span className={getStatusBadgeClass(request.status)}>
            {request.status}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-gold-500" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Full Name</p>
                    <p className="font-medium">
                      {request.first_name} {request.middle_name} {request.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4 text-stone-400" />
                      {request.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Phone Number</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4 text-stone-400" />
                      {request.phone_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Address</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-stone-400" />
                      {request.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* School History */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-gold-500" />
                  Wolmer's School History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Years Attended</p>
                    <p className="font-medium">
                      {Array.isArray(request.years_attended) 
                        ? request.years_attended.map(y => `${y.from_year}-${y.to_year}`).join(', ')
                        : request.years_attended_str || request.years_attended || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Last Form Class</p>
                    <p className="font-medium">{request.last_form_class}</p>
                  </div>
                </div>
                {request.co_curricular_activities && (
                  <div className="mt-4">
                    <p className="text-sm text-stone-500">Positions of Responsibility / Co-curricular Activities</p>
                    <p className="font-medium whitespace-pre-wrap">{request.co_curricular_activities}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Institution Details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-gold-500" />
                  Destination Institution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-stone-500">Institution Name</p>
                  <p className="font-medium">{request.institution_name}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Institution Address</p>
                  <p className="font-medium">{request.institution_address}</p>
                </div>
                {request.directed_to && (
                  <div>
                    <p className="text-sm text-stone-500">Letter Directed To</p>
                    <p className="font-medium">{request.directed_to}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-stone-500">Program Name</p>
                  <p className="font-medium">{request.program_name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold-500" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Needed By</p>
                    <p className="font-medium">{formatDate(request.needed_by_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Collection Method</p>
                    <p className="font-medium">
                      {request.collection_method === 'pickup' 
                        ? 'Picked Up at School' 
                        : 'Emailed to Institution'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            {request.documents && request.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gold-500" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {request.documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-stone-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-stone-400" />
                          <div>
                            <p className="font-medium text-sm">{doc.filename}</p>
                            <p className="text-xs text-stone-500">
                              Uploaded by {doc.uploaded_by} • {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gold-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.timeline.map((entry, index) => (
                    <div key={index} className="relative pl-6 pb-4 border-l-2 border-stone-200 last:border-l-0 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gold-500"></div>
                      <div>
                        <p className="font-medium text-sm">{entry.status}</p>
                        <p className="text-xs text-stone-500">{entry.note}</p>
                        <p className="text-xs text-stone-400 mt-1">
                          {formatDate(entry.timestamp)} • {entry.updated_by}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rejection Reason */}
            {request.status === 'Rejected' && request.rejection_reason && (
              <Card className="mt-6 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="font-heading text-lg text-red-800">
                    Rejection Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700">{request.rejection_reason}</p>
                </CardContent>
              </Card>
            )}

            {/* Staff Notes */}
            {request.staff_notes && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Staff Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-600">{request.staff_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
