import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { requestAPI, userAPI, exportAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate, getStatusBadgeClass } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  LayoutDashboard, FileText, Users, LogOut, Menu, X,
  Search, Filter, ChevronRight, UserPlus, Loader2, ArrowUpDown,
  ArrowUp, ArrowDown, AlertTriangle, Calendar, Award, Download, FileSpreadsheet, FileType
} from 'lucide-react';

export default function AdminRequests() {
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

  // Handle URL filter parameter from dashboard tiles
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      if (filterParam === 'all') {
        setStatusFilter('all');
      } else if (filterParam === 'overdue') {
        setStatusFilter('overdue');
      } else {
        setStatusFilter(filterParam);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchTerm, statusFilter, staffFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      const [requestsRes, staffRes] = await Promise.all([
        requestAPI.getAllRequests(),
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
      const status = statusFilter !== 'all' && statusFilter !== 'overdue' ? statusFilter : null;
      const response = await exportAPI.transcripts(format, status);
      // response.data is already a Blob when responseType:'blob' is set
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcript_requests_${new Date().toISOString().split('T')[0]}.${format}`;
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

  const isOverdue = (request) => {
    if (request.status === 'Completed' || request.status === 'Rejected') return false;
    const neededDate = new Date(request.needed_by_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return neededDate < today;
  };

  const filterAndSortRequests = () => {
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.student_name.toLowerCase().includes(term) ||
        r.student_email.toLowerCase().includes(term) ||
        r.school_id.toLowerCase().includes(term) ||
        (r.institution_name && r.institution_name.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter === 'overdue') {
      filtered = filtered.filter(r => isOverdue(r));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Staff filter
    if (staffFilter === 'unassigned') {
      filtered = filtered.filter(r => !r.assigned_staff_id);
    } else if (staffFilter !== 'all') {
      filtered = filtered.filter(r => r.assigned_staff_id === staffFilter);
    }

    // Sort
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
      ? <ArrowUp className="h-4 w-4 text-maroon-500" />
      : <ArrowDown className="h-4 w-4 text-maroon-500" />;
  };

  const handleAssignStaff = async () => {
    if (!selectedStaff || !selectedRequest) return;

    setAssigning(true);
    try {
      await requestAPI.update(selectedRequest.id, { assigned_staff_id: selectedStaff });
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
    <div className="flex h-screen bg-stone-50" data-testid="admin-requests-page">
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
              const isActive = location.pathname.startsWith(item.path) && 
                (item.path === '/admin/requests' || location.pathname === item.path);
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

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-stone-200 px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-stone-900">All Requests</h1>
              <p className="text-stone-500 text-sm hidden md:block">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                {hasActiveFilters && ' (filtered)'}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Search by name, email, school ID, or institution..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="status-filter">
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
                    <SelectItem value="overdue">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Overdue
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Staff Filter */}
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger data-testid="staff-filter">
                    <SelectValue placeholder="Assigned Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffMembers.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                )}
              </div>
              
              {/* Export Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-stone-500 mr-2">Export:</span>
                <Button size="sm" variant="outline" onClick={() => handleExport('xlsx')} disabled={exportLoading}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> XLSX
                </Button>
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
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-500 mx-auto"></div>
                  <p className="text-stone-500 mt-4">Loading requests...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-stone-900 mb-2">No requests found</h3>
                  <p className="text-stone-500">
                    {hasActiveFilters ? 'Try adjusting your filters' : 'No transcript requests have been submitted yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50">
                        <th 
                          className="text-left py-3 px-4 font-medium text-stone-500 cursor-pointer hover:text-stone-700"
                          onClick={() => handleSort('student_name')}
                        >
                          <div className="flex items-center gap-2">
                            Student
                            {getSortIcon('student_name')}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-stone-500">Institution</th>
                        <th className="text-left py-3 px-4 font-medium text-stone-500">Assigned To</th>
                        <th 
                          className="text-left py-3 px-4 font-medium text-stone-500 cursor-pointer hover:text-stone-700"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            {getSortIcon('status')}
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-medium text-stone-500 cursor-pointer hover:text-stone-700"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Submitted
                            {getSortIcon('created_at')}
                          </div>
                        </th>
                        <th 
                          className="text-left py-3 px-4 font-medium text-stone-500 cursor-pointer hover:text-stone-700"
                          onClick={() => handleSort('needed_by_date')}
                        >
                          <div className="flex items-center gap-2">
                            Needed By
                            {getSortIcon('needed_by_date')}
                          </div>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-stone-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => {
                        const overdue = isOverdue(request);
                        return (
                          <tr 
                            key={request.id} 
                            className={`border-b border-stone-100 hover:bg-stone-50 ${overdue ? 'bg-orange-50' : ''}`}
                          >
                            <td className="py-3 px-4">
                              <p className="font-medium text-stone-900">{request.student_name}</p>
                              <p className="text-xs text-stone-500">{request.school_id}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-stone-700 truncate max-w-[150px]" title={request.institution_name}>
                                {request.institution_name || '-'}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              {request.assigned_staff_name ? (
                                <span className="text-stone-700">{request.assigned_staff_name}</span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-maroon-500 hover:text-maroon-600 p-0 h-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRequest(request);
                                    setSelectedStaff(request.assigned_staff_id || '');
                                    setAssignDialogOpen(true);
                                  }}
                                  data-testid={`assign-btn-${request.id}`}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Assign
                                </Button>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={getStatusBadgeClass(request.status)}>
                                  {request.status}
                                </span>
                                {overdue && (
                                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                    <AlertTriangle className="h-3 w-3" />
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-stone-500">
                              {formatDate(request.created_at)}
                            </td>
                            <td className="py-3 px-4">
                              <div className={`flex items-center gap-1 ${overdue ? 'text-orange-600 font-medium' : 'text-stone-500'}`}>
                                {overdue && <Calendar className="h-3 w-3" />}
                                {formatDate(request.needed_by_date)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Link to={`/admin/request/${request.id}`}>
                                <Button variant="ghost" size="sm" data-testid={`view-detail-btn-${request.id}`}>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
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
            <DialogTitle className="font-heading">Assign Staff Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedRequest && (
              <div className="mb-4 p-3 bg-stone-50 rounded-lg">
                <p className="font-medium">{selectedRequest.student_name}</p>
                <p className="text-sm text-stone-500">{selectedRequest.school_id} • {selectedRequest.academic_year}</p>
              </div>
            )}
            <Label>Select Staff Member</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="mt-2" data-testid="assign-staff-select">
                <SelectValue placeholder="Choose a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map(staff => (
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
              disabled={assigning || !selectedStaff}
              className="bg-maroon-500 hover:bg-maroon-600"
              data-testid="confirm-assign-btn"
            >
              {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
