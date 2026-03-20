import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, Bell, BellOff, CheckCheck, FileText, Upload, AlertCircle, UserPlus } from 'lucide-react';

export default function StaffNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'status_update':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'document':
        return <Upload className="h-5 w-5 text-green-500" />;
      case 'assignment':
        return <UserPlus className="h-5 w-5 text-purple-500" />;
      case 'new_request':
        return <FileText className="h-5 w-5 text-maroon-500" />;
      default:
        return <Bell className="h-5 w-5 text-stone-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-stone-50" data-testid="staff-notifications-page">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/staff" className="flex items-center gap-2 text-stone-600 hover:text-maroon-500">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                data-testid="mark-all-read-btn"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2">
            Notifications
          </h1>
          <p className="text-stone-600">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-500 mx-auto"></div>
                <p className="text-stone-500 mt-4">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellOff className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-900 mb-2">No notifications</h3>
                <p className="text-stone-500">You'll be notified about new assignments and status updates</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${!notification.read ? 'bg-maroon-50/50' : ''} transition-colors`}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`font-medium ${!notification.read ? 'text-stone-900' : 'text-stone-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-stone-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-stone-400 mt-2">
                              {formatDateTime(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {notification.request_id && (
                              <Link 
                                to={
                                  notification.type?.includes('recommendation') 
                                    ? `/staff/recommendation/${notification.request_id}`
                                    : `/staff/request/${notification.request_id}`
                                }
                              >
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </Link>
                            )}
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
