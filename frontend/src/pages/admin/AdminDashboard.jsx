import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { analyticsAPI, requestAPI, recommendationAPI, notificationAPI, exportAPI, dataManagementAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, getStatusBadgeClass, exportAnalyticsToPDF, exportAnalyticsToCSV } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { 
  LayoutDashboard, FileText, Users, Bell, LogOut, Menu, X,
  Clock, CheckCircle, AlertCircle, XCircle, TrendingUp, AlertTriangle, UserCheck, Award,
  Download, FileSpreadsheet, FileType, Trash2, Database, AlertOctagon, Upload
} from 'lucide-react';

const COLORS = ['#800000', '#FFD700', '#78716C', '#22c55e', '#3b82f6', '#ef4444'];
const WORKLOAD_COLORS = ['#800000', '#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4', '#78716c'];

// Custom label renderer for pie charts
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
  if (value === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text 
      x={x} 
      y={y} 
      fill="#333" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central" 
      fontSize={12}
      fontWeight="500"
      style={{ pointerEvents: 'none' }}
    >
      {`${name}: ${value}`}
    </text>
  );
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [analytics, setAnalytics] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentRecommendations, setRecentRecommendations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const importFileRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, requestsRes, recommendationsRes, unreadRes] = await Promise.all([
        analyticsAPI.get(),
        requestAPI.getAllRequests(),
        recommendationAPI.getAllRequests(),
        notificationAPI.getUnreadCount(),
      ]);
      setAnalytics(analyticsRes.data);
      setRecentRequests(requestsRes.data.slice(0, 5));
      setRecentRecommendations(recommendationsRes.data.slice(0, 5));
      setUnreadCount(unreadRes.data.count);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format) => {
    setExportLoading(true);
    try {
      const response = type === 'transcripts' 
        ? await exportAPI.transcripts(format)
        : await exportAPI.recommendations(format);
      // response.data is already a Blob when responseType:'blob' is set
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`${type === 'transcripts' ? 'Transcript' : 'Recommendation'} report downloaded successfully`);
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      // Collect all chart elements
      const chartElements = {
        'Transcript Status Distribution': document.getElementById('transcript-status-chart'),
        'Recommendation Status Distribution': document.getElementById('recommendation-status-chart'),
        'Transcripts by Enrollment Status': document.getElementById('transcript-enrollment-chart'),
        'Recommendations by Enrollment Status': document.getElementById('recommendation-enrollment-chart'),
        'Collection Methods Comparison': document.getElementById('collection-methods-chart'),
        'Overdue Requests': document.getElementById('overdue-requests-chart'),
        'Staff Workload Distribution': document.getElementById('staff-workload-chart'),
        'Monthly Requests Trend': document.getElementById('monthly-trend-chart'),
      };

      await exportAnalyticsToPDF(analytics, chartElements);
      toast.success('Analytics report exported as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      exportAnalyticsToCSV(analytics);
      toast.success('Analytics data exported as CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    }
  };

  // Fetch data summary for data management
  const fetchDataSummary = async () => {
    try {
      const res = await dataManagementAPI.getSummary();
      setDataSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch data summary:', error);
    }
  };

  // Export all data to PDF
  const handleExportAllData = async () => {
    setExportLoading(true);
    try {
      const response = await dataManagementAPI.exportAllData();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wbs_complete_data_export_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Complete data exported to PDF');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  // Export all data to JSON
  const handleExportAllDataJSON = async () => {
    setExportLoading(true);
    try {
      const response = await dataManagementAPI.exportAllDataJSON();
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wbs_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Complete data exported to JSON — use this file to rebuild or migrate the app');
    } catch (error) {
      toast.error('Failed to export JSON data');
    } finally {
      setExportLoading(false);
    }
  };

  // Import data from JSON
  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const response = await dataManagementAPI.importDataJSON(file);
      const { message, imported_counts } = response.data;
      const summary = Object.entries(imported_counts)
        .map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`)
        .join(', ');
      toast.success(`${message}: ${summary}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import data');
    } finally {
      setImportLoading(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  // Open clear data modal
  const openClearModal = async () => {
    await fetchDataSummary();
    setShowClearModal(true);
    setConfirmText('');
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (confirmText !== 'DELETE ALL DATA') {
      toast.error('Please type "DELETE ALL DATA" to confirm');
      return;
    }
    
    setClearingData(true);
    try {
      const response = await dataManagementAPI.clearAllData();
      toast.success(response.data.message);
      setShowClearModal(false);
      setConfirmText('');
      // Refresh dashboard data
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to clear data');
    } finally {
      setClearingData(false);
    }
  };

  // Navigate to requests with filter
  const handleTileClick = (filter, type = 'transcripts') => {
    if (type === 'transcripts') {
      navigate(`/admin/requests?filter=${filter}`);
    } else {
      navigate(`/admin/recommendations?filter=${filter}`);
    }
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/requests', icon: FileText, label: 'Transcripts' },
    { path: '/admin/recommendations', icon: Award, label: 'Recommendations' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

  // Transcript status data
  const transcriptStatusData = analytics ? [
    { name: 'Pending', value: analytics.pending_requests, color: '#eab308' },
    { name: 'In Progress', value: analytics.in_progress_requests, color: '#3b82f6' },
    { name: 'Processing', value: analytics.processing_requests, color: '#8b5cf6' },
    { name: 'Ready', value: analytics.ready_requests, color: '#06b6d4' },
    { name: 'Completed', value: analytics.completed_requests, color: '#22c55e' },
    { name: 'Rejected', value: analytics.rejected_requests, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  // Recommendation status data
  const recommendationStatusData = analytics ? [
    { name: 'Pending', value: analytics.pending_recommendation_requests || 0, color: '#eab308' },
    { name: 'In Progress', value: analytics.in_progress_recommendation_requests || 0, color: '#3b82f6' },
    { name: 'Processing', value: analytics.processing_recommendation_requests || 0, color: '#8b5cf6' },
    { name: 'Ready', value: analytics.ready_recommendation_requests || 0, color: '#06b6d4' },
    { name: 'Completed', value: analytics.completed_recommendation_requests || 0, color: '#22c55e' },
    { name: 'Rejected', value: analytics.rejected_recommendation_requests || 0, color: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  // Enrollment status data for transcripts
  const enrollmentData = analytics?.requests_by_enrollment || [];

  // NEW: Recommendations by enrollment status
  const recommendationsEnrollmentData = analytics?.recommendations_by_enrollment || [];

  // NEW: Monthly requests trend data
  const monthlyTrendData = analytics?.requests_by_month?.map(item => ({
    month: item.month,
    transcripts: item.transcripts || item.count || 0,
    recommendations: item.recommendations || 0
  })) || [];

  // Collection method comparison
  const collectionMethodComparison = analytics ? [
    { 
      name: 'Pickup', 
      transcripts: analytics.requests_by_collection_method?.find(c => c.name.includes('Pickup'))?.value || 0,
      recommendations: analytics.recommendations_by_collection_method?.find(c => c.name.includes('Pickup'))?.value || 0
    },
    { 
      name: 'Emailed', 
      transcripts: analytics.requests_by_collection_method?.find(c => c.name.includes('Email'))?.value || 0,
      recommendations: analytics.recommendations_by_collection_method?.find(c => c.name.includes('Email'))?.value || 0
    },
    { 
      name: 'Delivery', 
      transcripts: analytics.requests_by_collection_method?.find(c => c.name.includes('Delivery'))?.value || 0,
      recommendations: analytics.recommendations_by_collection_method?.find(c => c.name.includes('Delivery'))?.value || 0
    },
  ] : [];

  // Overdue comparison
  const overdueComparison = [
    { name: 'Transcripts', value: analytics?.overdue_requests || 0, color: '#ef4444' },
    { name: 'Recommendations', value: analytics?.overdue_recommendation_requests || 0, color: '#f97316' },
  ];

  const staffWorkloadData = analytics?.staff_workload || [];

  return (
    <div className="flex h-screen bg-stone-50" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_13afcd2c-9b31-4868-9eb9-1450f0dbe963/artifacts/iuukr0xo_Wolmer%27s_Schools.png" 
                alt="Wolmer's Boys' School Crest" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="font-heading text-white font-semibold">Wolmer&apos;s</h1>
                <p className="text-stone-500 text-xs">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-maroon-500/20 text-maroon-400 border-l-4 border-maroon-500 -ml-1' 
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

          {/* Logout */}
          <div className="p-4 border-t border-stone-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-stone-400 hover:text-white hover:bg-stone-800"
              onClick={handleLogout}
              data-testid="admin-logout-btn"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden p-2 -ml-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div>
                <h1 className="font-heading text-xl md:text-2xl font-bold text-stone-900">Dashboard</h1>
                <p className="text-stone-500 text-sm hidden md:block">Overview of all requests</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-xs text-stone-500 font-medium">Export Dashboard Analytical Charts</p>
              <div className="flex items-center gap-2 md:gap-4">
                {/* Export Buttons */}
                <Button 
                  onClick={handleExportPDF} 
                  disabled={exportLoading || loading}
                  size="sm"
                  className="bg-[#800000] hover:bg-[#600000] hidden md:flex"
                >
                  {exportLoading ? (
                    <Clock className="h-4 w-4 md:mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 md:mr-2" />
                  )}
                  <span className="hidden md:inline">Export PDF</span>
                </Button>
                <Button 
                  onClick={handleExportCSV}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="hidden md:flex"
                >
                  <FileSpreadsheet className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Export CSV</span>
                </Button>

                {/* Existing buttons */}
                <Link to="/admin/notifications" className="relative" data-testid="admin-notifications-btn">
                  <Bell className="h-6 w-6 text-stone-500 cursor-pointer hover:text-stone-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-500"></div>
            </div>
          ) : (
            <>
              {/* Export Section */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Summary of Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Transcript Reports</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleExport('transcripts', 'xlsx')} disabled={exportLoading}>
                          <FileSpreadsheet className="h-4 w-4 mr-1" /> XLSX
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExport('transcripts', 'pdf')} disabled={exportLoading}>
                          <FileType className="h-4 w-4 mr-1" /> PDF
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExport('transcripts', 'docx')} disabled={exportLoading}>
                          <FileText className="h-4 w-4 mr-1" /> DOCX
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recommendation Reports</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleExport('recommendations', 'xlsx')} disabled={exportLoading}>
                          <FileSpreadsheet className="h-4 w-4 mr-1" /> XLSX
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExport('recommendations', 'pdf')} disabled={exportLoading}>
                          <FileType className="h-4 w-4 mr-1" /> PDF
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleExport('recommendations', 'docx')} disabled={exportLoading}>
                          <FileText className="h-4 w-4 mr-1" /> DOCX
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transcript Stats Cards */}
              <h2 className="font-heading text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-maroon-500" />
                Transcript Requests
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-maroon-300"
                  onClick={() => handleTileClick('all', 'transcripts')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Total</p>
                        <p className="text-2xl md:text-3xl font-bold text-stone-900">{analytics?.total_requests || 0}</p>
                      </div>
                      <FileText className="h-8 w-8 md:h-10 md:w-10 text-maroon-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-300"
                  onClick={() => handleTileClick('Pending', 'transcripts')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Pending</p>
                        <p className="text-2xl md:text-3xl font-bold text-yellow-600">{analytics?.pending_requests || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 md:h-10 md:w-10 text-yellow-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-green-300"
                  onClick={() => handleTileClick('Completed', 'transcripts')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Completed</p>
                        <p className="text-2xl md:text-3xl font-bold text-green-600">{analytics?.completed_requests || 0}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-red-300"
                  onClick={() => handleTileClick('Rejected', 'transcripts')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Rejected</p>
                        <p className="text-2xl md:text-3xl font-bold text-red-600">{analytics?.rejected_requests || 0}</p>
                      </div>
                      <XCircle className="h-8 w-8 md:h-10 md:w-10 text-red-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-shadow col-span-2 md:col-span-1 ${analytics?.overdue_requests > 0 ? 'border-orange-400 bg-orange-50' : ''}`}
                  onClick={() => handleTileClick('overdue', 'transcripts')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Overdue</p>
                        <p className={`text-2xl md:text-3xl font-bold ${analytics?.overdue_requests > 0 ? 'text-orange-600' : 'text-stone-400'}`}>
                          {analytics?.overdue_requests || 0}
                        </p>
                      </div>
                      <AlertTriangle className={`h-8 w-8 md:h-10 md:w-10 ${analytics?.overdue_requests > 0 ? 'text-orange-500/40' : 'text-stone-300/20'}`} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendation Stats Cards */}
              <h2 className="font-heading text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-gold-500" />
                Recommendation Letter Requests
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-gold-300"
                  onClick={() => handleTileClick('all', 'recommendations')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Total</p>
                        <p className="text-2xl md:text-3xl font-bold text-stone-900">{analytics?.total_recommendation_requests || 0}</p>
                      </div>
                      <Award className="h-8 w-8 md:h-10 md:w-10 text-gold-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-yellow-300"
                  onClick={() => handleTileClick('Pending', 'recommendations')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Pending</p>
                        <p className="text-2xl md:text-3xl font-bold text-yellow-600">{analytics?.pending_recommendation_requests || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 md:h-10 md:w-10 text-yellow-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-green-300"
                  onClick={() => handleTileClick('Completed', 'recommendations')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Completed</p>
                        <p className="text-2xl md:text-3xl font-bold text-green-600">{analytics?.completed_recommendation_requests || 0}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 md:h-10 md:w-10 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow hover:border-red-300"
                  onClick={() => handleTileClick('Rejected', 'recommendations')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Rejected</p>
                        <p className="text-2xl md:text-3xl font-bold text-red-600">{analytics?.rejected_recommendation_requests || 0}</p>
                      </div>
                      <XCircle className="h-8 w-8 md:h-10 md:w-10 text-red-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer hover:shadow-lg transition-shadow col-span-2 md:col-span-1 ${analytics?.overdue_recommendation_requests > 0 ? 'border-orange-400 bg-orange-50' : ''}`}
                  onClick={() => handleTileClick('overdue', 'recommendations')}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">Overdue</p>
                        <p className={`text-2xl md:text-3xl font-bold ${analytics?.overdue_recommendation_requests > 0 ? 'text-orange-600' : 'text-stone-400'}`}>
                          {analytics?.overdue_recommendation_requests || 0}
                        </p>
                      </div>
                      <AlertTriangle className={`h-8 w-8 md:h-10 md:w-10 ${analytics?.overdue_recommendation_requests > 0 ? 'text-orange-500/40' : 'text-stone-300/20'}`} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 1 - Overdue & Collection Methods */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 1. Overdue Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Overdue Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent id="overdue-requests-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={overdueComparison} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="value" name="Overdue Count">
                          {overdueComparison.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          <LabelList dataKey="value" position="right" fill="#333" fontSize={12} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 2. Collection Methods Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Collection Methods Comparison</CardTitle>
                  </CardHeader>
                  <CardContent id="collection-methods-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={collectionMethodComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="transcripts" fill="#800000" name="Transcripts">
                          <LabelList dataKey="transcripts" position="top" fill="#800000" fontSize={11} />
                        </Bar>
                        <Bar dataKey="recommendations" fill="#DAA520" name="Recommendations">
                          <LabelList dataKey="recommendations" position="top" fill="#DAA520" fontSize={11} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 2 - Enrollment Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 3. Transcripts by Enrollment Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Transcripts by Enrollment Status</CardTitle>
                  </CardHeader>
                  <CardContent id="transcript-enrollment-chart">
                    {enrollmentData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={enrollmentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={renderCustomizedLabel}
                            labelLine={true}
                          >
                            {enrollmentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-stone-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4. Recommendations by Enrollment Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Recommendations by Enrollment Status</CardTitle>
                  </CardHeader>
                  <CardContent id="recommendation-enrollment-chart">
                    {recommendationsEnrollmentData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={recommendationsEnrollmentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={renderCustomizedLabel}
                            labelLine={true}
                          >
                            {recommendationsEnrollmentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-stone-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 3 - Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* 5. Transcript Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Transcript Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent id="transcript-status-chart">
                    {transcriptStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={transcriptStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={renderCustomizedLabel}
                            labelLine={true}
                            isAnimationActive={false}
                          >
                            {transcriptStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-stone-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 6. Recommendation Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Recommendation Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent id="recommendation-status-chart">
                    {recommendationStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={recommendationStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={renderCustomizedLabel}
                            labelLine={true}
                            isAnimationActive={false}
                          >
                            {recommendationStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-stone-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 7. Staff Workload Distribution */}
              {staffWorkloadData.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Staff Workload Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent id="staff-workload-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={staffWorkloadData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="requests" name="Assigned Requests">
                          {staffWorkloadData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={WORKLOAD_COLORS[index % WORKLOAD_COLORS.length]} />
                          ))}
                          <LabelList dataKey="requests" position="top" fill="#333" fontSize={12} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* 8. Monthly Requests Trend */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Monthly Requests Trend (Last 6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent id="monthly-trend-chart">
                  {monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="transcripts" fill="#800000" name="Transcript Requests">
                          <LabelList dataKey="transcripts" position="top" fill="#800000" fontSize={11} />
                        </Bar>
                        <Bar dataKey="recommendations" fill="#DAA520" name="Recommendation Requests">
                          <LabelList dataKey="recommendations" position="top" fill="#DAA520" fontSize={11} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-stone-500">
                      No monthly data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transcript Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-maroon-500" />
                        Recent Transcript Requests
                      </span>
                      <Link to="/admin/requests" className="text-sm text-maroon-500 hover:underline">
                        View all
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentRequests.length === 0 ? (
                      <p className="text-stone-500 text-center py-4">No recent requests</p>
                    ) : (
                      <div className="space-y-3">
                        {recentRequests.map((request) => (
                          <Link
                            key={request.id}
                            to={`/admin/request/${request.id}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-stone-900">{request.student_name}</p>
                              <p className="text-sm text-stone-500">{formatDate(request.created_at)}</p>
                            </div>
                            <span className={getStatusBadgeClass(request.status)}>
                              {request.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Recommendation Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-gold-500" />
                        Recent Recommendation Requests
                      </span>
                      <Link to="/admin/recommendations" className="text-sm text-gold-600 hover:underline">
                        View all
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentRecommendations.length === 0 ? (
                      <p className="text-stone-500 text-center py-4">No recent requests</p>
                    ) : (
                      <div className="space-y-3">
                        {recentRecommendations.map((request) => (
                          <Link
                            key={request.id}
                            to={`/admin/recommendation/${request.id}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-50 transition-colors"
                          >
                            <div>
                              <p className="font-medium text-stone-900">{request.student_name}</p>
                              <p className="text-sm text-stone-500">{request.institution_name}</p>
                            </div>
                            <span className={getStatusBadgeClass(request.status)}>
                              {request.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Data Management Section */}
              <Card className="mt-8 border-2 border-red-200 bg-red-50/30">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2 text-red-700">
                    <Database className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Export & Import Row */}
                  <div className="bg-white rounded-lg p-4 border border-stone-200 mb-4">
                    <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-1">
                      <Download className="h-4 w-4 text-maroon-600" />
                      Backup &amp; Restore
                    </h3>
                    <p className="text-sm text-stone-600 mb-3">
                      Export all data to a JSON file for backup or migration. Import a previously exported JSON file to restore data.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={handleExportAllDataJSON}
                        disabled={exportLoading || importLoading}
                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {exportLoading ? 'Exporting...' : 'Export JSON Backup'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => importFileRef.current?.click()}
                        disabled={importLoading || exportLoading}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {importLoading ? 'Importing...' : 'Import JSON Backup'}
                      </Button>
                      <input
                        ref={importFileRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportJSON}
                      />
                      <Button
                        variant="outline"
                        onClick={handleExportAllData}
                        disabled={exportLoading || importLoading}
                        className="border-stone-300 text-stone-600 hover:bg-stone-50"
                      >
                        <FileType className="h-4 w-4 mr-2" />
                        {exportLoading ? 'Exporting...' : 'Export All Data (PDF)'}
                      </Button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-lg p-4 border border-red-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                          <AlertOctagon className="h-4 w-4 text-red-500" />
                          Clear All System Data
                        </h3>
                        <p className="text-sm text-stone-600 mt-1">
                          Remove all users (except admin), transcript requests, recommendation requests, and notifications.
                          This action cannot be undone. Export a JSON backup first.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={openClearModal}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Clear All Data</h2>
                  <p className="text-red-100 text-sm">This action is irreversible</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Data Summary */}
              {dataSummary && (
                <div className="bg-stone-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-stone-900 mb-3">Data to be deleted:</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Users:</span>
                      <span className="font-medium text-red-600">{dataSummary.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Transcripts:</span>
                      <span className="font-medium text-red-600">{dataSummary.transcript_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Recommendations:</span>
                      <span className="font-medium text-red-600">{dataSummary.recommendation_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Notifications:</span>
                      <span className="font-medium text-red-600">{dataSummary.notifications}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-stone-200 flex justify-between">
                    <span className="font-semibold text-stone-900">Total Records:</span>
                    <span className="font-bold text-red-600">{dataSummary.total}</span>
                  </div>
                </div>
              )}

              {/* Export Reminder */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Export data before clearing?</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Download a PDF backup of all current data before proceeding.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportAllData}
                      disabled={exportLoading}
                      className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {exportLoading ? 'Exporting...' : 'Export to PDF'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE ALL DATA</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Type confirmation text..."
                />
              </div>

              {/* Warning */}
              <p className="text-xs text-stone-500 mb-4">
                <strong>Note:</strong> The admin account (admin@wolmers.org) will be preserved.
              </p>
            </div>

            {/* Footer */}
            <div className="bg-stone-50 px-6 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowClearModal(false);
                  setConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearAllData}
                disabled={clearingData || confirmText !== 'DELETE ALL DATA'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300"
              >
                {clearingData ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
