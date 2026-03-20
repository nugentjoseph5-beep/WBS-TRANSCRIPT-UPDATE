import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { requestAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime, getStatusBadgeClass, getStatusColor } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  ArrowLeft, FileText, User, Mail, Phone, MapPin, 
  Calendar, Clock, Building, Download, CheckCircle, Edit, AlertCircle
} from 'lucide-react';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await requestAPI.getById(id);
      setRequest(res.data);
    } catch (error) {
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const res = await requestAPI.getDocument(doc.id);
      const blob = atob(res.data.content);
      const byteArray = new Uint8Array(blob.length);
      for (let i = 0; i < blob.length; i++) {
        byteArray[i] = blob.charCodeAt(i);
      }
      const file = new Blob([byteArray], { type: res.data.content_type });
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const statusOrder = ['Pending', 'In Progress', 'Processing', 'Ready', 'Completed'];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-500"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <FileText className="h-16 w-16 text-stone-300 mb-4" />
        <h2 className="text-xl font-semibold text-stone-900 mb-2">Request not found</h2>
        <Link to="/student">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="request-detail-page">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/student" className="flex items-center gap-2 text-stone-600 hover:text-maroon-500">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2">
              {request.first_name} {request.middle_name} {request.last_name}
            </h1>
            <p className="text-stone-600">
              Request ID: <span className="font-mono text-sm">{request.id.slice(0, 8)}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {request.status === 'Pending' ? (
              <Link to={`/student/request/${request.id}/edit`}>
                <Button variant="outline" className="border-maroon-500 text-maroon-500 hover:bg-maroon-50" data-testid="edit-request-btn">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Request
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-sm text-stone-500 bg-stone-100 px-3 py-1.5 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>Cannot edit - Status: {request.status}</span>
              </div>
            )}
            <span className={`${getStatusBadgeClass(request.status)} text-sm px-4 py-1.5`}>
              {request.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-maroon-500" />
                  Request Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Status Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    {statusOrder.map((status, index) => {
                      const currentIndex = statusOrder.indexOf(request.status);
                      const isCompleted = index <= currentIndex || request.status === 'Completed';
                      const isRejected = request.status === 'Rejected';
                      
                      return (
                        <div 
                          key={status} 
                          className={`flex flex-col items-center ${
                            index === 0 ? 'items-start' : index === statusOrder.length - 1 ? 'items-end' : ''
                          }`}
                        >
                          <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              isRejected ? 'bg-red-500 text-white' :
                              isCompleted ? 'bg-maroon-500 text-white' : 'bg-stone-200 text-stone-500'
                            }`}
                          >
                            {isCompleted && !isRejected ? <CheckCircle className="h-4 w-4" /> : index + 1}
                          </div>
                          <span className={`text-xs mt-1 hidden md:block ${
                            isCompleted && !isRejected ? 'text-maroon-500 font-medium' : 'text-stone-400'
                          }`}>
                            {status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        request.status === 'Rejected' ? 'bg-red-500' : 'bg-maroon-500'
                      }`}
                      style={{ 
                        width: request.status === 'Rejected' ? '100%' : 
                          `${((statusOrder.indexOf(request.status) + 1) / statusOrder.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Timeline Events */}
                <div className="space-y-4">
                  {request.timeline?.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStatusColor(event.status) }}
                        ></div>
                        {index < request.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-stone-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-stone-900">{event.note}</p>
                        <p className="text-sm text-stone-500">
                          {formatDateTime(event.timestamp)} • by {event.updated_by}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-maroon-500" />
                  Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">School ID</p>
                    <p className="font-medium">{request.school_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Enrollment Status</p>
                    <p className="font-medium capitalize">{request.enrollment_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Academic Year</p>
                    <p className="font-medium">{request.academic_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Needed By</p>
                    <p className="font-medium">{formatDate(request.needed_by_date)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-stone-500">Reason for Request</p>
                  <p className="font-medium">{request.reason}</p>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <p className="text-sm text-stone-500 mb-2">Collection Method</p>
                  <Badge variant="outline" className="capitalize">
                    {request.collection_method === 'pickup' ? 'Pickup at Bursary' :
                     request.collection_method === 'emailed' ? 'Email to Institution' :
                     'Physical Delivery'}
                  </Badge>
                </div>

                {request.rejection_reason && (
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-sm text-red-500 mb-1">Rejection Reason</p>
                    <p className="font-medium text-red-700">{request.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            {request.documents && request.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Download className="h-5 w-5 text-maroon-500" />
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
                          <FileText className="h-5 w-5 text-stone-500" />
                          <div>
                            <p className="font-medium text-sm">{doc.filename}</p>
                            <p className="text-xs text-stone-500">
                              Uploaded {formatDateTime(doc.uploaded_at)} by {doc.uploaded_by}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
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

          {/* Sidebar - Contact Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-maroon-500" />
                  Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Wolmer's Email</p>
                    <p className="font-medium text-sm break-all">{request.wolmers_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Personal Email</p>
                    <p className="font-medium text-sm break-all">{request.personal_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Phone</p>
                    <p className="font-medium text-sm">{request.phone_number}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Institution Info - Always show */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-maroon-500" />
                  Destination Institution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Institution Name</p>
                    <p className="font-medium text-sm">{request.institution_name || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Address</p>
                    <p className="font-medium text-sm">{request.institution_address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Email</p>
                    <p className="font-medium text-sm break-all">{request.institution_email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Phone</p>
                    <p className="font-medium text-sm">{request.institution_phone || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Staff */}
            {request.assigned_staff_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-maroon-500" />
                    Assigned Staff
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{request.assigned_staff_name}</p>
                </CardContent>
              </Card>
            )}

            {/* Submission Info */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-maroon-500" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-stone-500">Submitted</p>
                  <p className="font-medium text-sm">{formatDateTime(request.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Last Updated</p>
                  <p className="font-medium text-sm">{formatDateTime(request.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
