import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { requestAPI, recommendationAPI, notificationAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, getStatusBadgeClass } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Bell, LogOut, Plus, FileText, Clock, CheckCircle, 
  XCircle, ChevronRight, Menu, X, Search, Filter, Award
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [transcriptRequests, setTranscriptRequests] = useState([]);
  const [recommendationRequests, setRecommendationRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('transcripts');

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

  // Filter and search transcript requests
  const filteredTranscripts = useMemo(() => {
    let filtered = [...transcriptRequests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.first_name.toLowerCase().includes(term) ||
        r.last_name.toLowerCase().includes(term) ||
        r.school_id.toLowerCase().includes(term) ||
        r.academic_year.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term) ||
        (r.institution_name && r.institution_name.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    return filtered;
  }, [transcriptRequests, searchTerm, statusFilter]);

  // Filter and search recommendation requests
  const filteredRecommendations = useMemo(() => {
    let filtered = [...recommendationRequests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.first_name.toLowerCase().includes(term) ||
        r.last_name.toLowerCase().includes(term) ||
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
    inProgress: transcriptRequests.filter(r => ['In Progress', 'Processing', 'Ready'].includes(r.status)).length,
    completed: transcriptRequests.filter(r => r.status === 'Completed').length,
  };

  const recommendationStats = {
    total: recommendationRequests.length,
    pending: recommendationRequests.filter(r => r.status === 'Pending').length,
    inProgress: recommendationRequests.filter(r => ['In Progress', 'Processing', 'Ready'].includes(r.status)).length,
    completed: recommendationRequests.filter(r => r.status === 'Completed').length,
  };

  return (
    <div className="min-h-screen bg-stone-50" data-testid="student-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/student" className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png" 
                alt="Wolmer's Boys' School Crest" 
                className="w-10 h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="font-heading text-stone-900 font-semibold">WBS</h1>
                <p className="text-stone-500 text-xs">Transcript & Recommendation Tracker</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/student" className="text-maroon-500 font-medium">
                My Requests
              </Link>
              <Link to="/student/select-service" className="text-stone-600 hover:text-stone-900">
                New Request
              </Link>
              <Link to="/student/notifications" className="relative text-stone-600 hover:text-stone-900">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center notification-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-stone-900">{user?.full_name}</p>
                <p className="text-xs text-stone-500">Student</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex text-stone-600 hover:text-maroon-500"
                data-testid="logout-btn"
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
                to="/student" 
                className="block px-3 py-2 rounded-md text-maroon-500 font-medium bg-maroon-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Requests
              </Link>
              <Link 
                to="/student/select-service" 
                className="block px-3 py-2 rounded-md text-stone-600 hover:bg-stone-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                New Request
              </Link>
              <Link 
                to="/student/notifications" 
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
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-stone-600">Track and manage your transcript and recommendation letter requests</p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Link to="/student/select-service">
            <Button className="bg-maroon-500 hover:bg-maroon-600 text-white" data-testid="new-request-btn">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>

        {/* Tabs for Transcript and Recommendation Requests */}
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
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-maroon-300"
                onClick={() => setStatusFilter('all')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Total</p>
                      <p className="text-2xl font-bold text-stone-900">{transcriptStats.total}</p>
                    </div>
                    <FileText className="h-8 w-8 text-maroon-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-300"
                onClick={() => setStatusFilter('Pending')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{transcriptStats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300"
                onClick={() => setStatusFilter('In Progress')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">{transcriptStats.inProgress}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-green-300"
                onClick={() => setStatusFilter('Completed')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{transcriptStats.completed}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search by name, school ID, academic year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
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

            {/* Transcript Requests List */}
            <Card className="bg-white">
              <CardHeader className="border-b border-stone-100">
                <CardTitle className="font-heading text-xl flex items-center justify-between">
                  <span>Transcript Requests</span>
                  {filteredTranscripts.length !== transcriptRequests.length && (
                    <span className="text-sm font-normal text-stone-500">
                      Showing {filteredTranscripts.length} of {transcriptRequests.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-500 mx-auto"></div>
                    <p className="text-stone-500 mt-4">Loading requests...</p>
                  </div>
                ) : transcriptRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No transcript requests yet</h3>
                    <p className="text-stone-500 mb-4">Start by creating your first transcript request</p>
                    <Link to="/student/new-request">
                      <Button className="bg-maroon-500 hover:bg-maroon-600">
                        <Plus className="h-4 w-4 mr-2" />
                        New Request
                      </Button>
                    </Link>
                  </div>
                ) : filteredTranscripts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No matching requests</h3>
                    <p className="text-stone-500 mb-4">Try adjusting your search or filter criteria</p>
                    <Button 
                      variant="outline" 
                      onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {filteredTranscripts.map((request) => (
                      <Link
                        key={request.id}
                        to={`/student/request/${request.id}`}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                        data-testid={`request-item-${request.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-medium text-stone-900">
                              {request.first_name} {request.last_name} - {request.academic_year}
                            </p>
                            <p className="text-sm text-stone-500">
                              Submitted {formatDate(request.created_at)} • {
                                request.collection_method === 'pickup' ? 'Pickup at Bursary' :
                                request.collection_method === 'emailed' ? 'Email to Institution' :
                                'Physical Delivery'
                              }
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
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-gold-300"
                onClick={() => setStatusFilter('all')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Total</p>
                      <p className="text-2xl font-bold text-stone-900">{recommendationStats.total}</p>
                    </div>
                    <Award className="h-8 w-8 text-gold-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-300"
                onClick={() => setStatusFilter('Pending')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{recommendationStats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300"
                onClick={() => setStatusFilter('In Progress')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">{recommendationStats.inProgress}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="bg-white cursor-pointer hover:shadow-lg transition-shadow hover:border-green-300"
                onClick={() => setStatusFilter('Completed')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{recommendationStats.completed}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search by name, institution, program..."
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

            {/* Recommendation Requests List */}
            <Card className="bg-white">
              <CardHeader className="border-b border-stone-100">
                <CardTitle className="font-heading text-xl flex items-center justify-between">
                  <span>Recommendation Letter Requests</span>
                  {filteredRecommendations.length !== recommendationRequests.length && (
                    <span className="text-sm font-normal text-stone-500">
                      Showing {filteredRecommendations.length} of {recommendationRequests.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
                    <p className="text-stone-500 mt-4">Loading requests...</p>
                  </div>
                ) : recommendationRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <Award className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No recommendation requests yet</h3>
                    <p className="text-stone-500 mb-4">Start by creating your first recommendation letter request</p>
                    <Link to="/student/new-recommendation">
                      <Button className="bg-gold-500 hover:bg-gold-600 text-stone-900">
                        <Plus className="h-4 w-4 mr-2" />
                        New Request
                      </Button>
                    </Link>
                  </div>
                ) : filteredRecommendations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-2">No matching requests</h3>
                    <p className="text-stone-500 mb-4">Try adjusting your search or filter criteria</p>
                    <Button 
                      variant="outline" 
                      onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {filteredRecommendations.map((request) => (
                      <Link
                        key={request.id}
                        to={`/student/recommendation/${request.id}`}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                        data-testid={`recommendation-item-${request.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(request.status)}
                          <div>
                            <p className="font-medium text-stone-900">
                              {request.first_name} {request.last_name} - {request.institution_name}
                            </p>
                            <p className="text-sm text-stone-500">
                              Submitted {formatDate(request.created_at)} • {request.program_name} • {
                                request.collection_method === 'pickup' ? 'Pickup at School' : 'Email to Institution'
                              }
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
