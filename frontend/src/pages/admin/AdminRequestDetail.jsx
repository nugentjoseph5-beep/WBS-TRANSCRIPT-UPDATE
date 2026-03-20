import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { requestAPI, userAPI } from '@/lib/api';
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
  XCircle, Loader2, UserPlus, LayoutDashboard, Users, Award, LogOut,
  BookOpen, ShieldCheck, CalendarIcon, Save, FileDown
} from 'lucide-react';

export default function AdminRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
        requestAPI.getById(id),
        userAPI.getStaffMembers(),
      ]);
      setRequest(requestRes.data);
      setStaffMembers(staffRes.data);
      setSelectedStaff(requestRes.data.assigned_staff_id || '');
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
      await requestAPI.update(id, { 
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
      await requestAPI.update(id, { rejection_reason: rejectionReason });
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
      await requestAPI.update(id, { assigned_staff_id: selectedStaff });
      toast.success('Staff assigned successfully');
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to assign staff');
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await requestAPI.uploadDocument(id, file);
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/requests/${id}/export/${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Format: "Transcript Request - FirstName LastName - YYYY-MM-DD.pdf"
      const studentName = `${request.first_name} ${request.last_name}`;
      const dateSubmitted = request.created_at ? new Date(request.created_at).toISOString().split('T')[0] : 'date-unknown';
      a.download = `Transcript Request - ${studentName} - ${dateSubmitted}.${format}`;
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

  const handleSaveClearance = async () => {    setSavingClearance(true);
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
      await requestAPI.update(id, { administrative_clearance: clearanceData });
      toast.success('Administrative clearance saved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to save administrative clearance');
    } finally {
      setSavingClearance(false);
    }
  };

  const statusOrder = ['Pending', 'In Progress', 'Processing', 'Ready', 'Completed'];
  const currentStatusIndex = request ? statusOrder.indexOf(request.status) : -1;

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/requests', icon: FileText, label: 'Transcripts' },
    { path: '/admin/recommendations', icon: Award, label: 'Recommendations' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

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
        <Link to="/admin/requests">
          <Button variant="outline">Back to Requests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50" data-testid="admin-request-detail">
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
                <h1 className="font-heading text-white font-semibold">Wolmer's</h1>
                <p className="text-stone-500 text-xs">Admin Portal</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.path === '/admin/requests';
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
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-maroon-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.full_name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.full_name}</p>
                <p className="text-stone-500 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-stone-400 hover:text-white hover:bg-stone-800"
              onClick={handleLogout}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/requests" className="flex items-center gap-2 text-stone-600 hover:text-maroon-500">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Requests</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileDown className="h-4 w-4 mr-1" />}
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('docx')}
                disabled={exporting}
                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileDown className="h-4 w-4 mr-1" />}
                DOCX
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2">
                {request.first_name} {request.middle_name} {request.last_name}
              </h1>
              <p className="text-stone-600">
                {request.school_id && <>School ID: <span className="font-medium">{request.school_id}</span> • </>}
                Academic Year: <span className="font-medium">{request.academic_year}</span>
                {request.date_of_birth && <> • DOB: <span className="font-medium">{request.date_of_birth}</span></>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`${getStatusBadgeClass(request.status)} text-sm px-4 py-1.5`}>
                {request.status}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignDialogOpen(true)}
                className="border-maroon-300 text-maroon-600 hover:bg-maroon-50"
                data-testid="assign-staff-btn"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {request.assigned_staff_name ? 'Reassign' : 'Assign Staff'}
              </Button>
            </div>
          </div>

          {/* Assignment Info Banner */}
          {request.assigned_staff_name && (
            <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gold-800">
                <strong>Assigned to:</strong> {request.assigned_staff_name}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Update Card */}
              {request.status !== 'Completed' && request.status !== 'Rejected' && (
                <Card className="border-l-4 border-l-maroon-500">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-maroon-500" />
                      Update Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {statusOrder.map((status, index) => {
                        const isCompleted = index < currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;
                        const isNext = index === currentStatusIndex + 1;
                        
                        return (
                          <Button
                            key={status}
                            variant={isCurrent ? 'default' : 'outline'}
                            size="sm"
                            disabled={updating || isCompleted || (!isNext && !isCurrent)}
                            onClick={() => isNext && handleStatusUpdate(status)}
                            className={`
                              ${isCurrent ? 'bg-maroon-500 hover:bg-maroon-600 text-white' : ''}
                              ${isCompleted ? 'opacity-50' : ''}
                              ${isNext ? 'border-maroon-500 text-maroon-600 hover:bg-maroon-50' : ''}
                            `}
                            data-testid={`status-btn-${status.toLowerCase().replace(' ', '-')}`}
                          >
                            {isCompleted && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => setRejectDialogOpen(true)}
                        data-testid="reject-btn"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-maroon-500" />
                    Request Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                      <p className="text-sm text-stone-500">Enrollment Status</p>
                      <p className="font-medium capitalize">{request.enrollment_status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">Collection Method</p>
                      <p className="font-medium capitalize">
                        {request.collection_method === 'pickup' ? 'Pickup at Bursary' :
                         request.collection_method === 'emailed' ? 'Email to Institution' :
                         'Courier Delivery (DHL)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">Needed By</p>
                      <p className="font-medium">{formatDate(request.needed_by_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">Submitted</p>
                      <p className="font-medium">{formatDate(request.created_at)}</p>
                    </div>
                    {request.last_form_class && (
                      <div>
                        <p className="text-sm text-stone-500">Last Form Class</p>
                        <p className="font-medium">{request.last_form_class}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-stone-500">Number of Copies</p>
                      <p className="font-medium">{request.number_of_copies || 1}</p>
                    </div>
                    {request.received_transcript_before && (
                      <div>
                        <p className="text-sm text-stone-500">Received Transcript Before?</p>
                        <p className="font-medium">{request.received_transcript_before}</p>
                      </div>
                    )}
                    {request.delivery_address && (
                      <div className="col-span-2">
                        <p className="text-sm text-stone-500">Delivery Address</p>
                        <p className="font-medium">{request.delivery_address}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-stone-500">Reason for Request</p>
                    <p className="font-medium">{request.reason}</p>
                    {request.other_reason && <p className="text-sm text-stone-600 mt-1">{request.other_reason}</p>}
                  </div>

                  {/* External Exams */}
                  {request.external_exams && request.external_exams.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-maroon-500" />
                        <p className="text-sm font-medium text-stone-700">External Examinations</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {request.external_exams.map((e, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-maroon-50 border border-maroon-200 text-maroon-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            {e.exam === 'Other' && e.name ? `${e.name}` : e.exam}
                            {e.year && <span className="text-maroon-500">({e.year})</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Destination Institution - Show prominently */}
                  {request.institution_name && (
                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-sm text-stone-500 mb-2">Destination Institution</p>
                      <div className="bg-maroon-50 border border-maroon-200 rounded-lg p-4">
                        <p className="font-semibold text-stone-900 mb-1">{request.institution_name}</p>
                        {request.institution_address && (
                          <p className="text-sm text-stone-600">{request.institution_address}</p>
                        )}
                        {request.institution_email && (
                          <p className="text-sm text-stone-600">{request.institution_email}</p>
                        )}
                        {request.institution_phone && (
                          <p className="text-sm text-stone-600">{request.institution_phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {request.rejection_reason && (
                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-sm text-red-500 mb-1">Rejection Reason</p>
                      <p className="font-medium text-red-700">{request.rejection_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-maroon-500" />
                    Documents
                  </CardTitle>
                  {request.status !== 'Completed' && request.status !== 'Rejected' && (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        data-testid="upload-document-btn"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {request.documents && request.documents.length > 0 ? (
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
                  ) : (
                    <p className="text-stone-400 text-center py-4">No documents uploaded yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Student Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-maroon-500" />
                    Student Contact
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

              {/* Institution Info */}
              {(request.institution_name || request.institution_address || request.institution_email) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-maroon-500" />
                      Destination Institution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {request.institution_name && (
                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-stone-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-stone-500">Institution Name</p>
                          <p className="font-semibold text-sm text-stone-900">{request.institution_name}</p>
                        </div>
                      </div>
                    )}
                    {request.institution_address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-stone-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-stone-500">Address</p>
                          <p className="font-medium text-sm">{request.institution_address}</p>
                        </div>
                      </div>
                    )}
                    {request.institution_email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-stone-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-stone-500">Email</p>
                          <p className="font-medium text-sm break-all">{request.institution_email}</p>
                        </div>
                      </div>
                    )}
                    {request.institution_phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-stone-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-stone-500">Phone</p>
                          <p className="font-medium text-sm">{request.institution_phone}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Request Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <CalendarIcon2 className="h-5 w-5 text-maroon-500" />
                    Request Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-stone-500">Request ID</p>
                    <p className="font-mono text-xs">{request.id}</p>
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
            </div>
          </div>

          {/* Administrative Clearance Section */}
          <div className="mt-8 max-w-full pb-8">
            <Card className="border-2 border-maroon-200 bg-maroon-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2 text-maroon-800">
                  <ShieldCheck className="h-5 w-5 text-maroon-600" />
                  Administrative Clearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 bg-white rounded-lg border border-stone-200 p-3">
                    <Checkbox
                      id="no_fees_outstanding"
                      checked={clearance.no_fees_outstanding}
                      onCheckedChange={(checked) => setClearance(prev => ({ ...prev, no_fees_outstanding: !!checked }))}
                      className="data-[state=checked]:bg-maroon-600 data-[state=checked]:border-maroon-600 mt-0.5"
                    />
                    <Label htmlFor="no_fees_outstanding" className="font-medium cursor-pointer text-stone-700">
                      No fees outstanding
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg border border-stone-200 p-3">
                    <Checkbox
                      id="no_admin_obligations"
                      checked={clearance.no_admin_obligations}
                      onCheckedChange={(checked) => setClearance(prev => ({ ...prev, no_admin_obligations: !!checked }))}
                      className="data-[state=checked]:bg-maroon-600 data-[state=checked]:border-maroon-600 mt-0.5"
                    />
                    <Label htmlFor="no_admin_obligations" className="font-medium cursor-pointer text-stone-700">
                      No outstanding administrative obligations
                    </Label>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount_paid" className="text-sm font-medium text-stone-700">Amount Paid ($)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm font-medium">$</span>
                      <Input
                        id="amount_paid"
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
                    <Label htmlFor="receipt_number" className="text-sm font-medium text-stone-700">Receipt #</Label>
                    <Input
                      id="receipt_number"
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

                {/* Saved indicator */}
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
                    className="bg-maroon-600 hover:bg-maroon-700 text-white"
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
            <DialogTitle className="font-heading text-red-600">Reject Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Reason for Rejection</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a detailed reason for rejecting this request..."
              rows={4}
              className="mt-2"
              data-testid="rejection-reason-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject}
              disabled={updating}
              className="bg-red-500 hover:bg-red-600"
              data-testid="confirm-reject-btn"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {request.assigned_staff_id ? 'Reassign Staff Member' : 'Assign Staff Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {request.assigned_staff_name && (
              <p className="text-sm text-stone-500 mb-4">
                Currently assigned to: <strong>{request.assigned_staff_name}</strong>
              </p>
            )}
            <Label>Select Staff Member</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="mt-2" data-testid="staff-select">
                <SelectValue placeholder="Choose a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name}
                    {staff.id === request.assigned_staff_id && ' (current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {staffMembers.length === 0 && (
              <p className="text-sm text-stone-500 mt-2">
                No staff members available. <Link to="/admin/users" className="text-maroon-500 hover:underline">Add staff members</Link>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignStaff}
              disabled={updating || !selectedStaff}
              className="bg-maroon-500 hover:bg-maroon-600"
              data-testid="confirm-assign-btn"
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {request.assigned_staff_id ? 'Reassign' : 'Assign'}
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
