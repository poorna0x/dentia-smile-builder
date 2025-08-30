import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import LogoutButton from '@/components/LogoutButton';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  Stethoscope,
  Clock,
  CheckCircle,
  XCircle,
  CalendarDays,
  UserCheck,
  Activity
} from 'lucide-react';

// Types
interface IncomeBreakdown {
  total_income: number;
  cash_amount: number;
  upi_amount: number;
  card_amount: number;
  payment_methods: {
    cash?: { amount: number; percentage: number };
    upi?: { amount: number; percentage: number };
    card?: { amount: number; percentage: number };
  };
}

interface DoctorPerformance {
  doctor_id: string;
  doctor_name: string;
  treatments_started: number;
  treatments_completed: number;
  treatments_assisted: number;
  total_revenue: number;
  attribution_details: any[];
}

interface AppointmentAnalytics {
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  rescheduled_appointments: number;
  no_show_appointments: number;
  completion_rate: number;
  cancellation_rate: number;
  status_breakdown: {
    completed: { count: number; percentage: number };
    cancelled: { count: number; percentage: number };
    rescheduled: { count: number; percentage: number };
    no_show: { count: number; percentage: number };
  };
}

interface TreatmentAnalytics {
  total_treatments: number;
  total_revenue: number;
  average_treatment_value: number;
  treatment_breakdown: Record<string, { count: number; revenue: number; percentage: number }>;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clinic, loading: clinicLoading } = useClinic();

  // State
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [isOpenCustomRange, setIsOpenCustomRange] = useState(false);
  const [loading, setLoading] = useState(false);

  // Analytics data
  const [incomeData, setIncomeData] = useState<IncomeBreakdown | null>(null);
  const [doctorData, setDoctorData] = useState<DoctorPerformance[]>([]);
  const [appointmentData, setAppointmentData] = useState<AppointmentAnalytics | null>(null);
  const [treatmentData, setTreatmentData] = useState<TreatmentAnalytics | null>(null);

  // Check permissions
  useEffect(() => {
    // Get user role from session storage
    const userRole = sessionStorage.getItem('userRole');
    
    if (userRole !== 'dentist') {
      toast.error('Access denied. Only dentists can view analytics.');
      navigate('/admin');
    }
  }, [navigate]);

  // Calculate date range based on time period
  const dateRange = useMemo(() => {
    const today = new Date();
    
    switch (timePeriod) {
      case 'daily':
        return {
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      case 'weekly':
        return {
          start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'monthly':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        };
      case 'yearly':
        return {
          start: format(startOfYear(today), 'yyyy-MM-dd'),
          end: format(endOfYear(today), 'yyyy-MM-dd')
        };
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          return {
            start: format(customDateRange.from, 'yyyy-MM-dd'),
            end: format(customDateRange.to, 'yyyy-MM-dd')
          };
        }
        return {
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        };
    }
  }, [timePeriod, customDateRange]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!clinic?.id) return;
    
    setLoading(true);
    try {
      // Fetch income breakdown
      const { data: incomeResult } = await supabase.rpc('get_income_breakdown', {
        clinic_uuid: clinic.id,
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      if (incomeResult) {
        setIncomeData(incomeResult[0]);
      }

      // Fetch doctor performance
      const { data: doctorResult } = await supabase.rpc('get_doctor_performance', {
        clinic_uuid: clinic.id,
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      if (doctorResult) {
        setDoctorData(doctorResult);
      }

      // Fetch appointment analytics
      const { data: appointmentResult } = await supabase.rpc('get_appointment_analytics', {
        clinic_uuid: clinic.id,
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      if (appointmentResult) {
        setAppointmentData(appointmentResult[0]);
      }

      // Fetch treatment analytics
      const { data: treatmentResult } = await supabase.rpc('get_treatment_analytics', {
        clinic_uuid: clinic.id,
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      if (treatmentResult) {
        setTreatmentData(treatmentResult[0]);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Load analytics on mount and when date range changes
  useEffect(() => {
    if (clinic?.id) {
      fetchAnalytics();
    }
  }, [clinic?.id, dateRange]);

  // Export analytics as CSV
  const exportAnalytics = () => {
    const csvData = [
      ['Analytics Report', ''],
      ['Period', `${dateRange.start} to ${dateRange.end}`],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Income Breakdown', ''],
      ['Total Income', incomeData?.total_income || 0],
      ['Cash', incomeData?.cash_amount || 0],
      ['UPI', incomeData?.upi_amount || 0],
      ['Card', incomeData?.card_amount || 0],
      [''],
      ['Appointment Statistics', ''],
      ['Total Appointments', appointmentData?.total_appointments || 0],
      ['Completed', appointmentData?.completed_appointments || 0],
      ['Cancelled', appointmentData?.cancelled_appointments || 0],
      ['Rescheduled', appointmentData?.rescheduled_appointments || 0],
      ['No Shows', appointmentData?.no_show_appointments || 0],
      [''],
      ['Treatment Statistics', ''],
      ['Total Treatments', treatmentData?.total_treatments || 0],
      ['Total Revenue', treatmentData?.total_revenue || 0],
      ['Average Treatment Value', treatmentData?.average_treatment_value || 0],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">{clinic?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportAnalytics}
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalytics}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {timePeriod === 'custom' && (
              <Popover open={isOpenCustomRange} onOpenChange={setIsOpenCustomRange}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, "LLL dd, y")} -{" "}
                          {format(customDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(customDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={customDateRange.from}
                    selected={customDateRange}
                    onSelect={(range) => {
                      setCustomDateRange(range);
                      if (range?.from && range?.to) {
                        setIsOpenCustomRange(false);
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Badge variant="secondary" className="text-sm">
              {dateRange.start} to {dateRange.end}
            </Badge>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Income Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span>Income Breakdown</span>
                  </CardTitle>
                  <CardDescription>
                    Total income: ₹{incomeData?.total_income?.toLocaleString() || 0}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incomeData?.payment_methods?.cash && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium">Cash</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{incomeData.payment_methods.cash.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{incomeData.payment_methods.cash.percentage}%</div>
                        </div>
                      </div>
                    )}
                    
                    {incomeData?.payment_methods?.upi && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">UPI</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{incomeData.payment_methods.upi.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{incomeData.payment_methods.upi.percentage}%</div>
                        </div>
                      </div>
                    )}
                    
                    {incomeData?.payment_methods?.card && (
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="font-medium">Card</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{incomeData.payment_methods.card.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{incomeData.payment_methods.card.percentage}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    <span>Appointment Statistics</span>
                  </CardTitle>
                  <CardDescription>
                    Total appointments: {appointmentData?.total_appointments || 0}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Completed</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{appointmentData?.completed_appointments || 0}</div>
                        <div className="text-sm text-gray-600">{appointmentData?.completion_rate || 0}%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium">Cancelled</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{appointmentData?.cancelled_appointments || 0}</div>
                        <div className="text-sm text-gray-600">{appointmentData?.cancellation_rate || 0}%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium">Rescheduled</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{appointmentData?.rescheduled_appointments || 0}</div>
                        <div className="text-sm text-gray-600">
                          {appointmentData?.status_breakdown?.rescheduled?.percentage || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Doctor Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5 text-indigo-600" />
                  <span>Doctor Performance</span>
                </CardTitle>
                <CardDescription>
                  Treatment attribution and revenue by doctor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {doctorData.length > 0 ? (
                  <div className="space-y-4">
                    {doctorData.map((doctor) => (
                      <div key={doctor.doctor_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{doctor.doctor_name}</h3>
                          <Badge variant="secondary">
                            ₹{doctor.total_revenue.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{doctor.treatments_started}</div>
                            <div className="text-sm text-gray-600">Started</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{doctor.treatments_completed}</div>
                            <div className="text-sm text-gray-600">Completed</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{doctor.treatments_assisted}</div>
                            <div className="text-sm text-gray-600">Assisted</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No doctor performance data available for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Treatment Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-orange-600" />
                  <span>Treatment Analytics</span>
                </CardTitle>
                <CardDescription>
                  Total treatments: {treatmentData?.total_treatments || 0} | 
                  Total revenue: ₹{treatmentData?.total_revenue?.toLocaleString() || 0} | 
                  Average: ₹{treatmentData?.average_treatment_value?.toLocaleString() || 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {treatmentData?.treatment_breakdown && Object.keys(treatmentData.treatment_breakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(treatmentData.treatment_breakdown).map(([treatment, data]) => (
                      <div key={treatment} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{treatment}</div>
                          <div className="text-sm text-gray-600">{data.count} treatments</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{data.revenue.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{data.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No treatment data available for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
