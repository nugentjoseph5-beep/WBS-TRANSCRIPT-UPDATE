import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { requestAPI, recommendationAPI, notificationAPI, exportAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getStatusBadgeClass } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Bell, LogOut, FileText, Clock, CheckCircle, 
  XCircle, ChevronRight, Menu, X, Search, Filter, Award, Download, FileSpreadsheet, FileType
} from 'lucide-react';

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [transcriptRequests, setTranscriptRequests] = useState([]);
  const [recommendationRequests, setRecommendationRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('transcripts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transcriptsRes, recommendationsRes, unreadRes] = await Promise.all([
        requestAPI.getAll(),
        recommendationAPI.getAll(),
        notificationAPI.getUnreadCount(),
      ]);
      setTranscriptRequests(transcriptsRes.data);
      setRecommendationRequests(recommendationsRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExportTranscripts = async (format) => {
    setExportLoading(true);
    try {
      const status = statusFilter !== 'all' ? statusFilter : null;
      const response = await exportAPI.transcripts(format, status);
      // response.data is already a Blob when responseType:'blob' is set
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my_transcript_assignments_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportRecommendations = async (format) => {
    setExportLoading(true);
    try {
      const status = statusFilter !== 'all' ? statusFilter : null;
      const response = await exportAPI.recommendations(format, status);
      // response.data is already a Blob when responseType:'blob' is set
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my_recommendation_assignments_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  // Filter transcript requests
  const filteredTranscripts = useMemo(() => {
    let filtered = [...transcriptRequests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.student_name.toLowerCase().includes(term) ||
        r.student_email.toLowerCase().includes(term) ||
        r.school_id.toLowerCase().includes(term) ||
        (r.institution_name && r.institution_name.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    return filtered;
  }, [transcriptRequests, searchTerm, statusFilter]);

  // Filter recommendation requests
  const filteredRecommendations = useMemo(() => {
    let filtered = [...recommendationRequests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.student_name.toLowerCase().includes(term) ||
        r.student_email.toLowerCase().includes(term) ||
        r.institution_name.toLowerCase().includes(term) ||
        r.program_name.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    return filtered;
  }, [recommendationRequests, searchTerm, statusFilter]);

  const transcriptStats = {
    total: transcriptRequests.length,
    pending: transcriptRequests.filter(r => r.status === 'Pending').length,
    inProgress: transcriptRequests.filter(r => ['In Progress', 'Processing'].includes(r.status)).length,
    ready: transcriptRequests.filter(r => r.status === 'Ready').length,
    completed: transcriptRequests.filter(r => r.status === 'Completed').length,
  };

  const recommendationStats = {
    total: recommendationRequests.length,
    pending: recommendationRequests.filter(r => r.status === 'Pending').length,
    inProgress: recommendationRequests.filter(r => ['In Progress', 'Processing'].includes(r.status)).length,
    ready: recommendationRequests.filter(r => r.status === 'Ready').length,
    completed: recommendationRequests.filter(r => r.status === 'Completed').length,
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="staff-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/staff" className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png" 
                alt="Wolmer's Boys' School Crest" 
                className="w-10 h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="font-heading text-stone-900 font-semibold">WBS</h1>
                <p className="text-stone-500 text-xs">Staff Portal</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/staff" className="text-gold-600 font-medium">
                My Assignments
              </Link>
              <Link to="/staff/notifications" className="relative" data-testid="staff-notifications-btn">
                <Bell className="h-5 w-5 text-stone-500 cursor-pointer hover:text-stone-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-stone-900">{user?.full_name}</p>
                <p className="text-xs text-stone-500">Staff</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex text-stone-600 hover:text-gold-500"
                data-testid="staff-logout-btn"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link 
                to="/staff" 
                className="block px-3 py-2 rounded-md text-gold-600 font-medium bg-gold-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Assignments
              </Link>
              <Link 
                to="/staff/notifications" 
                className="flex items-center justify-between px-3 py-2 rounded-md text-stone-600 hover:bg-stone-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="bg-red-500">{unreadCount}</Badge>
                )}
              </Link>
              <hr className="my-2" />
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-stone-900">{user?.full_name}</p>
                <p className="text-xs text-stone-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-md text-left text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2">
            Welcome, {user?.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-stone-600">Manage your assigned transcript and recommendation requests</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="transcripts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Transcripts ({transcriptRequests.length})
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Recommendations ({recommendationRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Transcript Requests Tab */}
          <TabsContent value="transcripts" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-gold-300"
                onClick={() => setStatusFilter('all')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total</p>
                  <p className="text-2xl font-bold text-stone-900">{transcriptStats.total}</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-300"
                onClick={() => setStatusFilter('Pending')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{transcriptStats.pending}</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300"
                onClick={() => setStatusFilter('In Progress')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{transcriptStats.inProgress}</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-cyan-300"
                onClick={() => setStatusFilter('Ready')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Ready</p>
                  <p className="text-2xl font-bold text-cyan-600">{transcriptStats.ready}</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-green-300"
                onClick={() => setStatusFilter('Completed')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{transcriptStats.completed}</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search by student, school ID, institution..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Ready">Ready</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-stone-50 p-4 rounded-lg border border-stone-200">
              <span className="text-sm text-stone-500 mr-2">Export:</span>
              <Button size="sm" variant="outline" onClick={() => handleExportTranscripts('xlsx')} disabled={exportLoading}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExportTranscripts('pdf')} disabled={exportLoading}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExportTranscripts('docx')} disabled={exportLoading}>
                <FileType className="h-4 w-4 mr-1" /> Word
              </Button>
            </div>

            {/* Requests List */}
            <Card className="bg-white">
              <CardHeader className="border-b border-stone-100">
                <CardTitle className="font-heading text-xl">
                  Assigned Transcript Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-500 mx-auto"></div>
                  </div>
                ) : transcriptRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No assigned requests</h3>
                    <p className="text-stone-500">Transcript requests assigned to you will appear here</p>
                  </div>
                ) : filteredTranscripts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No matching requests</h3>
                    <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {filteredTranscripts.map((request) => (
                      <Link
                        key={request.id}
                        to={`/staff/request/${request.id}`}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-medium text-stone-900">
                              {request.student_name} - {request.academic_year}
                            </p>
                            <p className="text-sm text-stone-500">
                              Needed by {formatDate(request.needed_by_date)}
                              {request.institution_name && ` • ${request.institution_name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={getStatusBadgeClass(request.status)}>
                            {request.status}
                          </span>
                          <ChevronRight className="h-5 w-5 text-stone-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendation Requests Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-gold-300"
                onClick={() => setStatusFilter('all')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total</p>
                  <p className="text-2xl font-bold text-stone-900">{recommendationStats.total}</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-300"
                onClick={() => setStatusFilter('Pending')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{recommendationStats.pending}</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300"
                onClick={() => setStatusFilter('In Progress')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{recommendationStats.inProgress}</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-cyan-300"
                onClick={() => setStatusFilter('Ready')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Ready</p>
                  <p className="text-2xl font-bold text-cyan-600">{recommendationStats.ready}</p>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-green-300"
                onClick={() => setStatusFilter('Completed')}
              >
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{recommendationStats.completed}</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search by student, institution, program..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Ready">Ready</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-2 bg-stone-50 p-4 rounded-lg border border-stone-200">
              <span className="text-sm text-stone-500 mr-2">Export:</span>
              <Button size="sm" variant="outline" onClick={() => handleExportRecommendations('xlsx')} disabled={exportLoading}>
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExportRecommendations('pdf')} disabled={exportLoading}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExportRecommendations('docx')} disabled={exportLoading}>
                <FileType className="h-4 w-4 mr-1" /> Word
              </Button>
            </div>

            {/* Requests List */}
            <Card className="bg-white">
              <CardHeader className="border-b border-stone-100">
                <CardTitle className="font-heading text-xl">
                  Assigned Recommendation Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
                  </div>
                ) : recommendationRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <Award className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No assigned requests</h3>
                    <p className="text-stone-500">Recommendation requests assigned to you will appear here</p>
                  </div>
                ) : filteredRecommendations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No matching requests</h3>
                    <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {filteredRecommendations.map((request) => (
                      <Link
                        key={request.id}
                        to={`/staff/recommendation/${request.id}`}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-medium text-stone-900">
                              {request.student_name} - {request.institution_name}
                            </p>
                            <p className="text-sm text-stone-500">
                              Needed by {formatDate(request.needed_by_date)} • {request.program_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={getStatusBadgeClass(request.status)}>
                            {request.status}
                          </span>
                          <ChevronRight className="h-5 w-5 text-stone-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
