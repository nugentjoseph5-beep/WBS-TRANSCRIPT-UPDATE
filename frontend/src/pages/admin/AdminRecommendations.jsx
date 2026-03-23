import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { recommendationAPI, userAPI, exportAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate, getStatusBadgeClass } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  LayoutDashboard, FileText, Users, LogOut, Menu, X,
  Search, Filter, ChevronRight, UserPlus, Loader2, ArrowUpDown,
  ArrowUp, ArrowDown, Award, Download, FileSpreadsheet, FileType
} from 'lucide-react';

export default function AdminRecommendations() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setStatusFilter(filterParam === 'all' ? 'all' : filterParam);
    }
  }, [searchParams]);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchTerm, statusFilter, staffFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      const [requestsRes, staffRes] = await Promise.all([
        recommendationAPI.getAllRequests(),
        userAPI.getStaffMembers(),
      ]);
      setRequests(requestsRes.data);
      setStaffMembers(staffRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const status = statusFilter !== 'all' ? statusFilter : null;
      const response = await exportAPI.recommendations(format, status);
      // response.data is already a Blob when responseType:'blob' is set
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recommendation_requests_${new Date().toISOString().split('T')[0]}.${format}`;
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

  const filterAndSortRequests = () => {
    let filtered = [...requests];

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

    if (staffFilter === 'unassigned') {
      filtered = filtered.filter(r => !r.assigned_staff_id);
    } else if (staffFilter !== 'all') {
      filtered = filtered.filter(r => r.assigned_staff_id === staffFilter);
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      
      if (sortBy === 'created_at' || sortBy === 'needed_by_date') {
        aVal = new Date(a[sortBy]);
        bVal = new Date(b[sortBy]);
      } else if (sortBy === 'student_name') {
        aVal = a.student_name.toLowerCase();
        bVal = b.student_name.toLowerCase();
      } else if (sortBy === 'status') {
        const statusOrder = ['Pending', 'In Progress', 'Processing', 'Ready', 'Completed', 'Rejected'];
        aVal = statusOrder.indexOf(a.status);
        bVal = statusOrder.indexOf(b.status);
      } else {
        aVal = a[sortBy];
        bVal = b[sortBy];
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    setFilteredRequests(filtered);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-stone-400" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-gold-500" />
      : <ArrowDown className="h-4 w-4 text-gold-500" />;
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff || !selectedRequest) return;

    setAssigning(true);
    try {
      await recommendationAPI.update(selectedRequest.id, { assigned_staff_id: selectedStaff });
      toast.success('Staff assigned successfully');
      setAssignDialogOpen(false);
      setSelectedRequest(null);
      setSelectedStaff('');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStaffFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setSearchParams({});
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/requests', icon: FileText, label: 'Transcripts' },
    { path: '/admin/recommendations', icon: Award, label: 'Recommendations' },
    { path: '/admin/users', icon: Users, label: 'Users' },
  ];

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || staffFilter !== 'all';

  return (
    <div className="flex h-screen bg-stone-50" data-testid="admin-recommendations-page">
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
              const isActive = location.pathname === item.path || 
                (item.path === '/admin/recommendations' && location.pathname.startsWith('/admin/recommendation'));
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-stone-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="md:hidden p-2 hover:bg-stone-100 rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <Award className="h-6 w-6 text-gold-500" />
                  Recommendation Letters
                </h1>
                <p className="text-stone-500 text-sm">Manage recommendation letter requests</p>
              </div>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-stone-900">{user?.full_name}</p>
              <p className="text-xs text-stone-500">Administrator</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Search by student, institution, program..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
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
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <UserPlus className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Assigned Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Export Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-stone-500 mr-2">Export Detailed Reports:</span>
                <Button size="sm" variant="outline" onClick={() => handleExport('pdf')} disabled={exportLoading}>
                  <FileType className="h-4 w-4 mr-1" /> PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('docx')} disabled={exportLoading}>
                  <FileText className="h-4 w-4 mr-1" /> DOCX
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardHeader className="border-b border-stone-100">
              <CardTitle className="font-heading text-lg flex items-center justify-between">
                <span>Recommendation Requests ({filteredRequests.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <Award className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-stone-900 mb-2">No recommendation requests</h3>
                  <p className="text-stone-500">No requests match your current filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase cursor-pointer hover:bg-stone-100"
                          onClick={() => handleSort('student_name')}
                        >
                          <div className="flex items-center gap-1">
                            Student {getSortIcon('student_name')}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                          Institution / Program
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase cursor-pointer hover:bg-stone-100"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status {getSortIcon('status')}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                          Assigned To
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase cursor-pointer hover:bg-stone-100"
                          onClick={() => handleSort('needed_by_date')}
                        >
                          <div className="flex items-center gap-1">
                            Needed By {getSortIcon('needed_by_date')}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-stone-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-stone-900">{request.student_name}</p>
                              <p className="text-sm text-stone-500">{request.student_email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-stone-900">{request.institution_name}</p>
                              <p className="text-sm text-stone-500">{request.program_name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={getStatusBadgeClass(request.status)}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {request.assigned_staff_name ? (
                              <span className="text-stone-900">{request.assigned_staff_name}</span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setAssignDialogOpen(true);
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Assign
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-stone-500">
                            {formatDate(request.needed_by_date)}
                          </td>
                          <td className="px-4 py-4">
                            <Link to={`/admin/recommendation/${request.id}`}>
                              <Button variant="ghost" size="sm">
                                View <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Assign Staff Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-stone-500 mb-4">
              Assign a staff member to handle this recommendation request from{' '}
              <span className="font-medium text-stone-900">{selectedRequest?.student_name}</span>
            </p>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
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
              disabled={!selectedStaff || assigning}
              className="bg-gold-500 hover:bg-gold-600 text-stone-900"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Staff'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
