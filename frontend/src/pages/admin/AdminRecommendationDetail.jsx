import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { recommendationAPI, userAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate, formatDateTime, getStatusBadgeClass, getStatusColor } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, FileText, User, Mail, Phone, MapPin, 
  Calendar as CalendarIcon2, Clock, Building, Download, Upload, CheckCircle,
  XCircle, Loader2, UserPlus, LayoutDashboard, Users, Award, LogOut, Plus,
  BookOpen, ShieldCheck, CalendarIcon, Save, FileDown
} from 'lucide-react';

export default function AdminRecommendationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [request, setRequest] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coActivitiesEdit, setCoActivitiesEdit] = useState(false);
  const [coActivitiesValue, setCoActivitiesValue] = useState('');

  // Administrative Clearance state
  const [clearance, setClearance] = useState({
    no_fees_outstanding: false,
    no_admin_obligations: false,
    amount_paid: '',
    receipt_number: '',
    payment_date: '',
  });
  const [clearanceDate, setClearanceDate] = useState(null);
  const [savingClearance, setSavingClearance] = useState(false);
  const [exporting, setExporting] = useState(false);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [requestRes, staffRes] = await Promise.all([
        recommendationAPI.getById(id),
        userAPI.getStaffMembers(),
      ]);
      setRequest(requestRes.data);
      setStaffMembers(staffRes.data);
      setSelectedStaff(requestRes.data.assigned_staff_id || '');
      setCoActivitiesValue(requestRes.data.co_curricular_activities || '');
      // Load existing clearance data
      if (requestRes.data.administrative_clearance) {
        const ac = requestRes.data.administrative_clearance;
        setClearance({
          no_fees_outstanding: ac.no_fees_outstanding || false,
          no_admin_obligations: ac.no_admin_obligations || false,
          amount_paid: ac.amount_paid !== null && ac.amount_paid !== undefined ? String(ac.amount_paid) : '',
          receipt_number: ac.receipt_number || '',
          payment_date: ac.payment_date || '',
        });
        if (ac.payment_date) {
          try { setClearanceDate(new Date(ac.payment_date)); } catch(e) {}
        }
      }
    } catch (error) {
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    // Prompt for note before updating status
    setPendingStatus(newStatus);
    setStatusNote('');
    setStatusUpdateDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!statusNote.trim()) {
      toast.error('Please provide a note for the status change');
      return;
    }

    setUpdating(true);
    try {
      await recommendationAPI.update(id, { 
        status: pendingStatus,
        note: statusNote 
      });
      toast.success(`Status updated to ${pendingStatus}`);
      setStatusUpdateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setUpdating(true);
    try {
      await recommendationAPI.update(id, { rejection_reason: rejectionReason });
      toast.success('Request rejected');
      setRejectDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to reject request');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    setUpdating(true);
    try {
      await recommendationAPI.update(id, { assigned_staff_id: selectedStaff });
      toast.success('Staff assigned successfully');
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to assign staff');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveCoActivities = async () => {
    setUpdating(true);
    try {
      await recommendationAPI.update(id, { co_curricular_activities: coActivitiesValue });
      toast.success('Co-curricular activities updated successfully');
      setCoActivitiesEdit(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update co-curricular activities');
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await recommendationAPI.uploadDocument(id, file);
      toast.success('Document uploaded successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      // For recommendation documents, we need to use the transcript API's document endpoint
      // since they share the same upload directory structure
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/documents/${doc.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      const blob = atob(data.content);
      const byteArray = new Uint8Array(blob.length);
      for (let i = 0; i < blob.length; i++) {
        byteArray[i] = blob.charCodeAt(i);
      }
      const file = new Blob([byteArray], { type: data.content_type });
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/recommendations/${id}/export/${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Format: "Recommendation Letter Request - FirstName LastName - YYYY-MM-DD.pdf"
      const studentName = `${request.first_name} ${request.last_name}`;
      const dateSubmitted = request.created_at ? new Date(request.created_at).toISOString().split('T')[0] : 'date-unknown';
      a.download = `Recommendation Letter Request - ${studentName} - ${dateSubmitted}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveClearance = async () => {
    setSavingClearance(true);
    try {
      const clearanceData = {
        no_fees_outstanding: clearance.no_fees_outstanding,
        no_admin_obligations: clearance.no_admin_obligations,
        amount_paid: clearance.amount_paid !== '' ? parseFloat(clearance.amount_paid) : null,
        receipt_number: clearance.receipt_number || '',
        payment_date: clearanceDate ? format(clearanceDate, 'yyyy-MM-dd') : '',
        updated_by: user?.full_name || '',
        updated_at: new Date().toISOString(),
      };
      await recommendationAPI.update(id, { administrative_clearance: clearanceData });
      toast.success('Administrative clearance saved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to save administrative clearance');
    } finally {
      setSavingClearance(false);
    }
  };

  const statusOrder = ['Pending', 'In Progress', 'Processing', 'Ready', 'Completed'];

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/requests', icon: FileText, label: 'Transcripts' },
    { path: '/admin/recommendations', icon: Award, label: 'Recommendations' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-900">Request not found</h2>
          <Link to="/admin/recommendations" className="text-gold-500 hover:underline mt-2 block">
            Return to Recommendations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50" data-testid="admin-recommendation-detail">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-stone-800">
            <Link to="/admin" className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png" 
                alt="Wolmer's Boys' School Crest" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="font-heading text-white font-semibold">WBS</h1>
                <p className="text-stone-500 text-xs">Admin Portal</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.path === '/admin/recommendations' || 
                location.pathname.startsWith('/admin/recommendation');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-gold-500/20 text-gold-500 border-l-4 border-gold-500 -ml-1' 
                      : 'hover:bg-stone-800 text-stone-400 hover:text-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-stone-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-stone-400 hover:text-white hover:bg-stone-800"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin/recommendations" 
                className="flex items-center gap-2 text-stone-600 hover:text-gold-500"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Recommendations</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="border-gold-400 text-gold-700 hover:bg-gold-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileDown className="h-4 w-4 mr-1" />}
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('docx')}
                disabled={exporting}
                className="border-gold-400 text-gold-700 hover:bg-gold-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileDown className="h-4 w-4 mr-1" />}
                DOCX
              </Button>
              <span className={getStatusBadgeClass(request.status)}>
                {request.status}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <div className="mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-gold-600" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-stone-900">
                  Recommendation Letter Request
                </h1>
                <p className="text-stone-500">
                  Submitted {formatDate(request.created_at)} by {request.student_name}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Details Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Student Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-gold-500" />
                      Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-stone-500">Full Name</p>
                        <p className="font-medium">{request.first_name} {request.middle_name} {request.last_name}</p>
                      </div>
                      {request.date_of_birth && (
                        <div>
                          <p className="text-sm text-stone-500">Date of Birth</p>
                          <p className="font-medium">{request.date_of_birth}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-stone-500">Personal Email</p>
                        <p className="font-medium flex items-center gap-1">
                          <Mail className="h-4 w-4 text-stone-400" />
                          {request.email}
                        </p>
                      </div>
                      {request.student_email && (
                        <div>
                          <p className="text-sm text-stone-500">Wolmer's Email</p>
                          <p className="font-medium flex items-center gap-1">
                            <Mail className="h-4 w-4 text-stone-400" />
                            {request.student_email}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-stone-500">Phone</p>
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
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
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
                      {request.enrollment_status && (
                        <div>
                          <p className="text-sm text-stone-500">Enrollment Status</p>
                          <p className="font-medium capitalize">{request.enrollment_status}</p>
                        </div>
                      )}
                    </div>

                    {/* External Exams */}
                    {request.external_exams && request.external_exams.length > 0 && (
                      <div className="pt-3 border-t border-stone-100">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-gold-500" />
                          <p className="text-sm font-medium text-stone-700">External Examinations</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {request.external_exams.map((e, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-gold-50 border border-gold-200 text-gold-800 text-xs font-medium px-2.5 py-1 rounded-full">
                              {e.exam === 'Other' && e.name ? `${e.name}` : e.exam}
                              {e.year && <span className="text-gold-600">({e.year})</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(coActivitiesEdit || request.co_curricular_activities) && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-stone-500">Positions of Responsibility / Co-curricular Activities</p>
                          {!coActivitiesEdit && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setCoActivitiesEdit(true)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                        {coActivitiesEdit ? (
                          <div className="space-y-2">
                            <Textarea
                              value={coActivitiesValue}
                              onChange={(e) => setCoActivitiesValue(e.target.value)}
                              placeholder="Enter additional positions or activities..."
                              rows={4}
                              className="w-full"
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={handleSaveCoActivities}
                                disabled={updating}
                              >
                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setCoActivitiesEdit(false);
                                  setCoActivitiesValue(request.co_curricular_activities || '');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="font-medium whitespace-pre-wrap">{request.co_curricular_activities}</p>
                        )}
                      </div>
                    )}
                    {!coActivitiesEdit && !request.co_curricular_activities && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCoActivitiesEdit(true)}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Co-curricular Activities
                      </Button>
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
                  <CardContent className="space-y-4">
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
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-stone-500">Needed By</p>
                        <p className="font-medium flex items-center gap-1">
                          <CalendarIcon2 className="h-4 w-4 text-stone-400" />
                          {formatDate(request.needed_by_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Collection Method</p>
                        <p className="font-medium">
                          {request.collection_method === 'pickup' ? 'Pickup at School' : 
                           request.collection_method === 'delivery' ? 'Courier Delivery (DHL)' :
                           'Emailed to Institution'}
                        </p>
                      </div>
                    </div>
                    {request.delivery_address && (
                      <div>
                        <p className="text-sm text-stone-500">Delivery Address</p>
                        <p className="font-medium">{request.delivery_address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gold-500" />
                        Documents
                      </span>
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {request.documents?.length === 0 ? (
                      <p className="text-stone-500 text-sm">No documents uploaded yet</p>
                    ) : (
                      <div className="space-y-2">
                        {request.documents?.map((doc) => (
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
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Assign Staff */}
                    <div>
                      <Label className="text-sm text-stone-500">Assigned Staff</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium flex-1">
                          {request.assigned_staff_name || 'Not assigned'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssignDialogOpen(true)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Status Update */}
                    {request.status !== 'Rejected' && request.status !== 'Completed' && (
                      <div>
                        <Label className="text-sm text-stone-500">Update Status</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {statusOrder.map((status) => (
                            <Button
                              key={status}
                              variant={request.status === status ? 'default' : 'outline'}
                              size="sm"
                              disabled={updating || request.status === status}
                              onClick={() => handleStatusUpdate(status)}
                              className={request.status === status ? 'bg-gold-500 text-stone-900' : ''}
                            >
                              {status}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reject */}
                    {request.status !== 'Rejected' && request.status !== 'Completed' && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setRejectDialogOpen(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Request
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gold-500" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {request.timeline?.map((entry, index) => (
                        <div key={index} className="relative pl-6 pb-4 border-l-2 border-stone-200 last:border-l-0 last:pb-0">
                          <div 
                            className="absolute -left-[9px] top-0 w-4 h-4 rounded-full" 
                            style={{ backgroundColor: getStatusColor(entry.status) }}
                          ></div>
                          <div>
                            <p className="font-medium text-sm">{entry.status}</p>
                            <p className="text-xs text-stone-500">{entry.note}</p>
                            <p className="text-xs text-stone-400 mt-1">
                              {formatDateTime(entry.timestamp)} • {entry.updated_by}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Request Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <CalendarIcon2 className="h-5 w-5 text-gold-500" />
                      Request Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-stone-500">Request ID</p>
                      <p className="font-mono text-xs break-all">{request.id}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Submitted</p>
                      <p className="font-medium">{formatDateTime(request.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Last Updated</p>
                      <p className="font-medium">{formatDateTime(request.updated_at)}</p>
                    </div>
                    {request.assigned_staff_name && (
                      <div>
                        <p className="text-stone-500">Assigned To</p>
                        <p className="font-medium">{request.assigned_staff_name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Rejection Reason */}
                {request.status === 'Rejected' && request.rejection_reason && (
                  <Card className="border-red-200 bg-red-50">
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
              </div>
            </div>
          </div>

          {/* Administrative Clearance Section */}
          <div className="mt-8 max-w-full pb-8">
            <Card className="border-2 border-gold-200 bg-gold-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2 text-gold-800">
                  <ShieldCheck className="h-5 w-5 text-gold-600" />
                  Administrative Clearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 bg-white rounded-lg border border-stone-200 p-3">
                    <Checkbox
                      id="rec_no_fees_outstanding"
                      checked={clearance.no_fees_outstanding}
                      onCheckedChange={(checked) => setClearance(prev => ({ ...prev, no_fees_outstanding: !!checked }))}
                      className="data-[state=checked]:bg-gold-600 data-[state=checked]:border-gold-600 mt-0.5"
                    />
                    <Label htmlFor="rec_no_fees_outstanding" className="font-medium cursor-pointer text-stone-700">
                      No fees outstanding
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg border border-stone-200 p-3">
                    <Checkbox
                      id="rec_no_admin_obligations"
                      checked={clearance.no_admin_obligations}
                      onCheckedChange={(checked) => setClearance(prev => ({ ...prev, no_admin_obligations: !!checked }))}
                      className="data-[state=checked]:bg-gold-600 data-[state=checked]:border-gold-600 mt-0.5"
                    />
                    <Label htmlFor="rec_no_admin_obligations" className="font-medium cursor-pointer text-stone-700">
                      No outstanding administrative obligations
                    </Label>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rec_amount_paid" className="text-sm font-medium text-stone-700">Amount Paid ($)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm font-medium">$</span>
                      <Input
                        id="rec_amount_paid"
                        type="number"
                        min="0"
                        step="0.01"
                        value={clearance.amount_paid}
                        onChange={(e) => setClearance(prev => ({ ...prev, amount_paid: e.target.value }))}
                        className="pl-7 bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rec_receipt_number" className="text-sm font-medium text-stone-700">Receipt #</Label>
                    <Input
                      id="rec_receipt_number"
                      type="text"
                      value={clearance.receipt_number}
                      onChange={(e) => setClearance(prev => ({ ...prev, receipt_number: e.target.value }))}
                      className="bg-white"
                      placeholder="Receipt number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-stone-700">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal bg-white", !clearanceDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {clearanceDate ? format(clearanceDate, "MMM d, yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={clearanceDate}
                          onSelect={setClearanceDate}
                          initialFocus
                        />
                        <div className="p-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setClearanceDate(new Date())}
                          >
                            Today
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {request.administrative_clearance?.updated_at && (
                  <p className="text-xs text-stone-500">
                    Last saved: {formatDateTime(request.administrative_clearance.updated_at)}
                    {request.administrative_clearance.updated_by && ` by ${request.administrative_clearance.updated_by}`}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveClearance}
                    disabled={savingClearance}
                    className="bg-gold-600 hover:bg-gold-700 text-white"
                  >
                    {savingClearance ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" />Save Clearance</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Reason for Rejection</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this request..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Staff Member</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignStaff}
              disabled={updating || !selectedStaff}
              className="bg-gold-500 hover:bg-gold-600 text-stone-900"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Assign Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status to "{pendingStatus}"</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="status-note">Note for Status Change *</Label>
            <Textarea
              id="status-note"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Please provide a note explaining this status change..."
              className="mt-2"
              rows={4}
            />
            <p className="text-xs text-stone-500 mt-1">
              This note will be visible in the request timeline
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmStatusUpdate}
              disabled={updating || !statusNote.trim()}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
