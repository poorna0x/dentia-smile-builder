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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  Edit, 
  X, 
  User,
  MessageCircle,
  Search,
  LogOut,
  Plus,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle
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

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  slotInterval: number;
}

interface SchedulingSettings {
  appointmentsDisabled: boolean;
  disableMessage: string;
  disableUntilDate: string;
  disableUntilTime: string;
  weeklyHolidays: string[];
  customHolidays: string[];
  daySchedules: {
    [key: string]: DaySchedule;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [newAppointmentData, setNewAppointmentData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: ''
  });

  // Supabase hooks
  const { clinic, loading: clinicLoading } = useClinic();
  const { 
    appointments, 
    loading: appointmentsLoading, 
    error: appointmentsError,
    updateAppointment,
    deleteAppointment
  } = useAppointments();
  const { settings, loading: settingsLoading } = useSettings();

  // Default scheduling settings
  const [schedulingSettings, setSchedulingSettings] = useState<SchedulingSettings>({
    appointmentsDisabled: false,
    disableMessage: "We're currently not accepting new appointments. Please check back later or contact us directly.",
    disableUntilDate: '',
    disableUntilTime: '',
    weeklyHolidays: [],
    customHolidays: [],
    daySchedules: {
      Mon: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Tue: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Wed: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Thu: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Fri: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Sat: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 },
      Sun: { enabled: false, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00', slotInterval: 30 }
    }
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    // Check if admin is logged in
    if (!isAdminLoggedIn()) {
      navigate('/admin/login', { replace: true });
      return;
    }
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [navigate]);

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  // WhatsApp message templates
  const getWhatsAppMessage = (type: 'confirmation' | 'cancellation' | 'reminder', appointment: Appointment) => {
    const baseUrl = window.location.origin;
    const bookingLink = `${baseUrl}/appointment`;
    
    switch (type) {
      case 'confirmation':
        return `✅ Appointment Confirmed!

Dear ${appointment.name},
Your appointment is confirmed for ${format(new Date(appointment.date), 'MMMM dd, yyyy')} at ${appointment.time}.

📍 Location: Jeshna Dental Clinic
📞 Contact: +91 98765 43210

Please arrive 10 minutes early.
Cancel or reschedule: ${bookingLink}

Thank you for choosing Jeshna Dental Clinic!`;

      case 'cancellation':
        return `❌ Appointment Cancelled

Dear ${appointment.name},
Your appointment for ${format(new Date(appointment.date), 'MMMM dd, yyyy')} at ${appointment.time} has been cancelled.

You can book a new appointment here: ${bookingLink}

We apologize for any inconvenience.
Jeshna Dental Clinic`;

      case 'reminder':
        return `⏰ Appointment Reminder

Hi ${appointment.name},
This is a reminder for your appointment tomorrow at ${appointment.time}.

📍 Location: Jeshna Dental Clinic
📞 Contact: +91 98765 43210

Please confirm by replying "Yes" or "No"`;

      default:
        return '';
    }
  };

  const handleWhatsApp = (phone: string, type: 'confirmation' | 'cancellation' | 'reminder', appointment: Appointment) => {
    const message = getWhatsAppMessage(type, appointment);
    const encodedMessage = encodeURIComponent(message);
    // Remove any non-numeric characters from phone number
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEditDialog(true);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      if (updateAppointment) {
        await updateAppointment(appointmentId, { status: newStatus as any });
      }
      toast.success(`Appointment ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      if (updateAppointment) {
        await updateAppointment(appointmentId, { status: 'Completed' });
      }
      toast.success('Appointment marked as completed');
    } catch (error) {
      toast.error('Failed to complete appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
      try {
        if (updateAppointment) {
          await updateAppointment(appointmentId, { status: 'Cancelled' });
        }
        toast.success('Appointment cancelled');
        
        // Show WhatsApp button for cancellation message
        const appointment = appointments?.find(apt => apt.id === appointmentId);
        if (appointment) {
          toast.info('Click the WhatsApp button to send cancellation message to patient', {
            duration: 5000,
            action: {
              label: 'Send WhatsApp',
              onClick: () => handleWhatsApp(appointment.phone, 'cancellation', appointment)
            }
          });
        }
      } catch (error) {
        toast.error('Failed to cancel appointment');
      }
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      if (deleteAppointment) {
        await deleteAppointment(appointmentId);
      }
      toast.success('Appointment deleted permanently');
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  const handleScheduleUpdate = (day: string, field: keyof DaySchedule, value: any) => {
    setSchedulingSettings(prev => ({
      ...prev,
      daySchedules: {
        ...prev.daySchedules,
        [day]: {
          ...prev.daySchedules[day],
          [field]: value
        }
      }
    }));
  };

  const handleWeeklyHolidayToggle = (day: string) => {
    setSchedulingSettings(prev => ({
      ...prev,
      weeklyHolidays: prev.weeklyHolidays.includes(day)
        ? prev.weeklyHolidays.filter(d => d !== day)
        : [...prev.weeklyHolidays, day]
    }));
  };

  const [newCustomHoliday, setNewCustomHoliday] = useState('');

  const handleAddCustomHoliday = () => {
    if (newCustomHoliday) {
      setSchedulingSettings(prev => ({
        ...prev,
        customHolidays: [...prev.customHolidays, newCustomHoliday]
      }));
      setNewCustomHoliday('');
    }
  };

  const handleRemoveCustomHoliday = (holiday: string) => {
    setSchedulingSettings(prev => ({
      ...prev,
      customHolidays: prev.customHolidays.filter(h => h !== holiday)
    }));
  };

  // Use real appointments data if available, otherwise use empty array
  const realAppointments = appointments || [];
  const filteredAppointments = realAppointments.filter(appointment => {
    const matchesSearch = appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesDate = !filterDate || appointment.date === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const completedAppointments = realAppointments.filter(apt => apt.status === 'Completed').length;
  const cancelledAppointments = realAppointments.filter(apt => apt.status === 'Cancelled').length;
  const totalAppointments = realAppointments.length;

  // Show loading while data is being fetched
  if (isLoading || clinicLoading || appointmentsLoading || settingsLoading) {
  return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
            {clinicLoading && <p className="text-sm text-gray-500 mt-2">Loading clinic data...</p>}
            {appointmentsLoading && <p className="text-sm text-gray-500 mt-2">Loading appointments...</p>}
            {settingsLoading && <p className="text-sm text-gray-500 mt-2">Loading settings...</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage appointments and clinic settings</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                onClick={() => setShowSettings(!showSettings)} 
                variant="outline" 
                className="flex items-center gap-2 text-sm"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 text-sm">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
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
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedAppointments}</div>
                <p className="text-xs text-muted-foreground">Finished appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled Today</CardTitle>
                <X className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{cancelledAppointments}</div>
                <p className="text-xs text-muted-foreground">Cancelled appointments</p>
              </CardContent>
            </Card>
          </div>

          {/* Cancelled Appointments Section */}
          {cancelledAppointments > 0 && (
            <Card className="mb-6 md:mb-8">
              <CardHeader>
                <CardTitle className="text-red-700">Cancelled Appointments</CardTitle>
                <CardDescription>Recently cancelled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realAppointments
                    .filter(apt => apt.status === 'Cancelled')
                    .slice(0, 5)
                    .map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="font-medium text-gray-900">{appointment.name}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(appointment.date), 'yyyy-MM-dd')} at {appointment.time}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${appointment.phone}`, '_self')}
                            className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                            title="Call patient"
                          >
                            <Phone className="h-4 w-4" />
                            <span className="hidden sm:inline">Call</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsApp(appointment.phone, 'cancellation', appointment)}
                            className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                            title="Send WhatsApp message"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the appointment for ${appointment.name}? This action cannot be undone.`)) {
                                handleDeleteAppointment(appointment.id);
                              }
                            }}
                            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                            title="Delete appointment"
                          >
                            <X className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-8 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-w-[140px]"
                />
                {filterDate && filterDate !== format(new Date(), 'yyyy-MM-dd') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFilterDate(format(new Date(), 'yyyy-MM-dd'))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Reset to today"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px] border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setShowNewAppointmentDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Appointment</span>
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || filterDate || filterStatus !== 'all') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <span className="font-medium">Active Filters:</span>
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {filterDate && (
                    <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                      Date: {format(new Date(filterDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {filterStatus !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                      Status: {filterStatus}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDate(format(new Date(), 'yyyy-MM-dd'));
                    setFilterStatus('all');
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                Filter and manage appointment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead className="min-w-[150px]">Patient Name</TableHead>
                      <TableHead className="min-w-[120px]">Phone</TableHead>
                      <TableHead className="min-w-[140px]">Time Slot</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{appointment.name}</div>
                              <div className="text-sm text-gray-500 truncate">{appointment.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`tel:${appointment.phone}`, '_self')}
                                className="h-8 w-8 p-0 text-blue-600 border-blue-300 hover:bg-blue-50 flex-shrink-0"
                                title="Call patient"
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsApp(appointment.phone, 'confirmation', appointment)}
                                className="h-8 w-8 p-0 text-green-600 border-green-300 hover:bg-green-50 flex-shrink-0"
                                title="Send WhatsApp message"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm truncate">{appointment.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm">{format(new Date(appointment.date), 'MMM dd, yyyy')}</div>
                              <div className="text-xs text-gray-500 truncate">{appointment.time}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditAppointment(appointment)}
                              className="h-8 px-2 text-blue-600 border-blue-300 hover:bg-blue-50 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No appointments found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Section */}
          {showSettings && (
            <Card className="mt-6 md:mt-8">
            <CardHeader>
              <CardTitle>Scheduling Settings</CardTitle>
                <CardDescription>Control the appointment window and slot generation</CardDescription>
            </CardHeader>
              <CardContent className="space-y-6">
                {/* Disable Appointments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Disable All Appointments</Label>
                      <p className="text-sm text-gray-600">Temporarily stop accepting new appointments</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-1">
                      <Switch
                        checked={schedulingSettings.appointmentsDisabled}
                        onCheckedChange={(checked) => setSchedulingSettings(prev => ({
                          ...prev,
                          appointmentsDisabled: checked
                        }))}
                      />
                    </div>
                  </div>
                  
                  {schedulingSettings.appointmentsDisabled && (
                    <div className="space-y-3 p-4 bg-yellow-50 rounded-lg">
                      <Label htmlFor="disableMessage">Custom Message</Label>
                      <Input
                        id="disableMessage"
                        value={schedulingSettings.disableMessage}
                        onChange={(e) => setSchedulingSettings(prev => ({
                          ...prev,
                          disableMessage: e.target.value
                        }))}
                        placeholder="Enter custom message for disabled appointments"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={schedulingSettings.disableUntilDate}
                          onChange={(e) => setSchedulingSettings(prev => ({
                            ...prev,
                            disableUntilDate: e.target.value
                          }))}
                          placeholder="Disable until date"
                        />
                        <Input
                          type="time"
                          value={schedulingSettings.disableUntilTime}
                          onChange={(e) => setSchedulingSettings(prev => ({
                            ...prev,
                            disableUntilTime: e.target.value
                          }))}
                          placeholder="Disable until time"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Weekly Holidays */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Weekly Holidays</Label>
                  <p className="text-sm text-gray-600">Select days when the clinic is closed</p>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                    {days.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`holiday-${day}`}
                          checked={schedulingSettings.weeklyHolidays.includes(day)}
                          onCheckedChange={() => handleWeeklyHolidayToggle(day)}
                        />
                        <Label htmlFor={`holiday-${day}`} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Holidays */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Custom Holidays</Label>
                  <p className="text-sm text-gray-600">Add specific dates when the clinic is closed</p>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="Select holiday date"
                      className="flex-1"
                      value={newCustomHoliday}
                      onChange={(e) => setNewCustomHoliday(e.target.value)}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddCustomHoliday}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {schedulingSettings.customHolidays.map((holiday, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{holiday}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveCustomHoliday(holiday)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day Schedule Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Day Schedule Settings</Label>
                  <p className="text-sm text-gray-600">Set different schedules for each day of the week</p>
                  
                  {/* Day Selection */}
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <Button
                        key={day}
                        variant={selectedDay === day ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDay(day)}
                        className="min-w-[60px]"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>

                  {/* Selected Day Schedule */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{selectedDay} Schedule</CardTitle>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`enabled-${selectedDay}`} className="text-sm">Enabled</Label>
                          <div className="border-2 border-gray-300 rounded-lg p-1">
                            <Switch
                              id={`enabled-${selectedDay}`}
                              checked={schedulingSettings.daySchedules[selectedDay].enabled}
                              onCheckedChange={(checked) => handleScheduleUpdate(selectedDay, 'enabled', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`start-${selectedDay}`}>Start Time</Label>
                          <Input
                            id={`start-${selectedDay}`}
                            type="time"
                            value={schedulingSettings.daySchedules[selectedDay].startTime}
                            onChange={(e) => handleScheduleUpdate(selectedDay, 'startTime', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`end-${selectedDay}`}>End Time</Label>
                          <Input
                            id={`end-${selectedDay}`}
                            type="time"
                            value={schedulingSettings.daySchedules[selectedDay].endTime}
                            onChange={(e) => handleScheduleUpdate(selectedDay, 'endTime', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`break-start-${selectedDay}`}>Break Start</Label>
                          <Input
                            id={`break-start-${selectedDay}`}
                            type="time"
                            value={schedulingSettings.daySchedules[selectedDay].breakStart}
                            onChange={(e) => handleScheduleUpdate(selectedDay, 'breakStart', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`break-end-${selectedDay}`}>Break End</Label>
                          <Input
                            id={`break-end-${selectedDay}`}
                            type="time"
                            value={schedulingSettings.daySchedules[selectedDay].breakEnd}
                            onChange={(e) => handleScheduleUpdate(selectedDay, 'breakEnd', e.target.value)}
                          />
                        </div>
                </div>

                <div className="space-y-2">
                        <Label htmlFor={`interval-${selectedDay}`}>Slot Interval (minutes)</Label>
                        <Input
                          id={`interval-${selectedDay}`}
                          type="number"
                          min="15"
                          max="120"
                          step="15"
                          value={schedulingSettings.daySchedules[selectedDay].slotInterval}
                          onChange={(e) => handleScheduleUpdate(selectedDay, 'slotInterval', parseInt(e.target.value))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Notice */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className={`border rounded-lg p-4 ${
                appointmentsError 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center">
                  <div className={`mr-3 ${
                    appointmentsError ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {appointmentsError ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium ${
                      appointmentsError ? 'text-red-800' : 'text-green-800'
                    }`}>
                      {appointmentsError ? 'Database Connection Error' : 'Real-time Data Connected'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      appointmentsError ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {appointmentsError ? (
                        `Error: ${appointmentsError}. Using mock data for testing.`
                      ) : (
                        <>
                          Connected to Supabase! Appointments update in real-time. 
                          {filteredAppointments && filteredAppointments.length > 0 && (
                            <span className="ml-2 font-medium">
                              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} shown
                              {realAppointments.length !== filteredAppointments.length && (
                                <span className="text-green-600"> ({realAppointments.length} total)</span>
                              )}
                            </span>
                          )}
                          {filteredAppointments.length === 0 && realAppointments.length > 0 && (
                            <span className="ml-2 font-medium text-orange-600">
                              No appointments for selected filters ({realAppointments.length} total)
                            </span>
                          )}
                          {clinic && (
                            <span className="ml-2 text-xs">
                              Clinic: {clinic.name}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Manage appointment for {selectedAppointment?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <div className="text-sm text-gray-600 truncate">{selectedAppointment.name}</div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="text-sm text-gray-600 truncate">{selectedAppointment.phone}</div>
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="text-sm text-gray-600 truncate">{selectedAppointment.email}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <div className="text-sm text-gray-600">
                    {format(new Date(selectedAppointment.date), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <Label>Time</Label>
                  <div className="text-sm text-gray-600">{selectedAppointment.time}</div>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={selectedAppointment.status} 
                  onValueChange={(value) => handleStatusUpdate(selectedAppointment.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
                        </div>
        </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => selectedAppointment && handleCompleteAppointment(selectedAppointment.id)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </Button>
            <Button
              onClick={() => selectedAppointment && handleCancelAppointment(selectedAppointment.id)}
              variant="destructive"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={() => selectedAppointment && handleWhatsApp(selectedAppointment.phone, 'confirmation', selectedAppointment)}
              variant="outline"
              className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50 w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Admin;


