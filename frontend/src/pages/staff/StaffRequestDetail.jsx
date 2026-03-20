import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { requestAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { formatDate, formatDateTime, getStatusBadgeClass, getStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  ArrowLeft, FileText, User, Mail, Phone, MapPin, 
  Calendar, Clock, Building, Download, Upload, CheckCircle,
  XCircle, Loader2, FileDown, ShieldCheck, Save
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function StaffRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [exporting, setExporting] = useState(false);
  const [clearance, setClearance] = useState({
    no_fees_outstanding: false,
    no_admin_obligations: false,
    amount_paid: '',
    receipt_number: '',
  });
  const [clearanceDate, setClearanceDate] = useState(null);
  const [savingClearance, setSavingClearance] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [id]);

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

  const fetchRequest = async () => {
    try {
      const res = await requestAPI.getById(id);
      setRequest(res.data);
      // Load existing clearance
      if (res.data.administrative_clearance) {
        const ac = res.data.administrative_clearance;
        setClearance({
          no_fees_outstanding: ac.no_fees_outstanding || false,
          no_admin_obligations: ac.no_admin_obligations || false,
          amount_paid: ac.amount_paid !== null && ac.amount_paid !== undefined ? String(ac.amount_paid) : '',
          receipt_number: ac.receipt_number || '',
        });
        if (ac.payment_date) {
          const d = new Date(ac.payment_date);
          if (!isNaN(d)) setClearanceDate(d);
        }
      }
    } catch (error) {
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
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
      };
      await requestAPI.update(id, { administrative_clearance: clearanceData });
      toast.success('Administrative clearance saved successfully');
      fetchRequest();
    } catch (error) {
      toast.error('Failed to save administrative clearance');
    } finally {
      setSavingClearance(false);
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
      fetchRequest();
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
      fetchRequest();
    } catch (error) {
      toast.error('Failed to reject request');
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
      fetchRequest();
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

  const statusOrder = ['Pending', 'In Progress', 'Processing', 'Ready', 'Completed'];
  const currentStatusIndex = request ? statusOrder.indexOf(request.status) : -1;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
        <FileText className="h-16 w-16 text-stone-300 mb-4" />
        <h2 className="text-xl font-semibold text-stone-900 mb-2">Request not found</h2>
        <Link to="/staff">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="staff-request-detail">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/staff" className="flex items-center gap-2 text-stone-600 hover:text-gold-600">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`${getStatusBadgeClass(request.status)} text-sm px-4 py-1.5`}>
              {request.status}
            </span>
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
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileDown className="h-4 w-4 mr-1" />}
              DOCX
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update Card */}
            {request.status !== 'Completed' && request.status !== 'Rejected' && (
              <Card className="border-l-4 border-l-gold-500">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gold-500" />
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
                            ${isCurrent ? 'bg-gold-500 hover:bg-gold-600 text-maroon-900' : ''}
                            ${isCompleted ? 'opacity-50' : ''}
                            ${isNext ? 'border-gold-500 text-gold-600 hover:bg-gold-50' : ''}
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
                  <Clock className="h-5 w-5 text-gold-500" />
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
                  <FileText className="h-5 w-5 text-gold-500" />
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
                       'Physical Delivery'}
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
                </div>

                <div>
                  <p className="text-sm text-stone-500">Reason for Request</p>
                  <p className="font-medium">{request.reason}</p>
                </div>

                {/* Destination Institution - Show prominently */}
                {request.institution_name && (
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-sm text-stone-500 mb-2">Destination Institution</p>
                    <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
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
                  <Upload className="h-5 w-5 text-gold-500" />
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
                  <User className="h-5 w-5 text-gold-500" />
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

            {/* Institution Info - Always show */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-gold-500" />
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

            {/* Request Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gold-500" />
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Administrative Clearance - Full Width at Bottom */}
        <Card className="border border-maroon-200 bg-maroon-50/30 mt-6">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2 text-maroon-700">
              <ShieldCheck className="h-5 w-5" />
              Administrative Clearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="no_fees"
                  checked={clearance.no_fees_outstanding}
                  onCheckedChange={(v) => setClearance(p => ({ ...p, no_fees_outstanding: v }))}
                />
                <Label htmlFor="no_fees" className="text-sm font-medium cursor-pointer">
                  No fees outstanding
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="no_admin"
                  checked={clearance.no_admin_obligations}
                  onCheckedChange={(v) => setClearance(p => ({ ...p, no_admin_obligations: v }))}
                />
                <Label htmlFor="no_admin" className="text-sm font-medium cursor-pointer">
                  No outstanding administrative obligations
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1 block">Amount Paid (J$)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={clearance.amount_paid}
                  onChange={(e) => setClearance(p => ({ ...p, amount_paid: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1 block">Receipt Number</Label>
                <Input
                  placeholder="e.g. BUR-2024-001"
                  value={clearance.receipt_number}
                  onChange={(e) => setClearance(p => ({ ...p, receipt_number: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1 block">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-9 w-full justify-start text-left text-sm font-normal", !clearanceDate && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{clearanceDate ? format(clearanceDate, 'MMM d, yyyy') : 'Select date'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={clearanceDate} onSelect={setClearanceDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSaveClearance}
                  disabled={savingClearance}
                  size="sm"
                  className="bg-maroon-700 hover:bg-maroon-800 text-white w-full h-9"
                >
                  {savingClearance ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Clearance
                </Button>
              </div>
            </div>
            {request.administrative_clearance?.updated_by && (
              <p className="text-xs text-stone-400">
                Last updated by: {request.administrative_clearance.updated_by}
              </p>
            )}
          </CardContent>
        </Card>
      </main>

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
