import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isAdminLoggedIn, clearAdminSession } from '@/lib/auth';
import { useAppointments } from '@/hooks/useAppointments';
import { useSettings } from '@/hooks/useSettings';
import { useClinic } from '@/contexts/ClinicContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { showLocalNotification, sendPushNotification } from '@/lib/notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  Edit, 
  X, 
  User,
  PhoneCall,
  Search,
  LogOut,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react';

// Types
interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Cancelled' | 'Completed' | 'Rescheduled';
}

const Admin = () => {
  const navigate = useNavigate();
  const { clinic, loading: clinicLoading } = useClinic();
  const { 
    appointments, 
    loading: appointmentsLoading, 
    error: appointmentsError,
    updateAppointment,
    deleteAppointment
  } = useAppointments();
  const { settings, loading: settingsLoading } = useSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  // Show loading while data is being fetched
  if (clinicLoading || appointmentsLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if there's an issue
  if (appointmentsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-red-600 mb-4">⚠️ Error loading appointments</div>
            <p className="text-gray-600">{appointmentsError}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus as any });
      toast.success(`Appointment ${newStatus.toLowerCase()}`);
      
      // Send notification for status changes
      const appointment = appointments?.find(apt => apt.id === appointmentId);
      if (appointment) {
        await showLocalNotification({
          title: `Appointment ${newStatus}`,
          body: `${appointment.name} - ${appointment.date} at ${appointment.time}`,
          icon: '/logo.png',
          data: { url: '/admin' }
        });
        
        await sendPushNotification({
          title: `Appointment ${newStatus}`,
          body: `${appointment.name} - ${appointment.date} at ${appointment.time}`,
          icon: '/logo.png',
          data: { url: '/admin' }
        });
      }
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await deleteAppointment(appointmentId);
        toast.success('Appointment deleted');
      } catch (error) {
        toast.error('Failed to delete appointment');
      }
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const message = `Hi ${name}, regarding your appointment...`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${phone}?text=${encodedMessage}`, '_blank');
  };

  const filteredAppointments = (appointments || []).filter(appointment => {
    const matchesSearch = appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const completedAppointments = (appointments || []).filter(apt => apt.status === 'Completed').length;
  const cancelledAppointments = (appointments || []).filter(apt => apt.status === 'Cancelled').length;
  const totalAppointments = appointments?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage appointments and clinic settings</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setShowSettings(!showSettings)} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedAppointments}</div>
                <p className="text-xs text-muted-foreground">Successfully completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{cancelledAppointments}</div>
                <p className="text-xs text-muted-foreground">Cancelled appointments</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rescheduled">Rescheduled</option>
            </select>
          </div>

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                Manage patient appointments and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{appointment.name}</div>
                            <div className="text-sm text-gray-500">{appointment.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(appointment.phone)}
                            className="h-8 w-8 p-0"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmail(appointment.email)}
                            className="h-8 w-8 p-0"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsApp(appointment.phone, appointment.name)}
                            className="h-8 w-8 p-0"
                          >
                            <PhoneCall className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{format(new Date(appointment.date), 'MMM dd, yyyy')}</div>
                            <div className="text-sm text-gray-500">{appointment.time}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <select
                            value={appointment.status}
                            onChange={(e) => handleStatusUpdate(appointment.id, e.target.value)}
                            className="text-xs px-2 py-1 border rounded"
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Rescheduled">Rescheduled</option>
                          </select>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No appointments found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Data Notice */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Real-time Data</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Connected to Supabase! Appointments update in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;


