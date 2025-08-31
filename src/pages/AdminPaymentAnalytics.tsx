import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { simplePaymentApi } from '@/lib/payment-system-simple';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, RefreshCw, Download, TrendingUp, Calendar as CalendarIcon, DollarSign, Clock, Filter, ChevronDown } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, isWithinInterval, parseISO } from 'date-fns';

const AdminPaymentAnalytics = () => {
  const navigate = useNavigate();
  const { clinic, clinicLoading } = useClinic();
  const { user } = useAuth();
  const { isDentist, isStaff, hasPermission, permissionsLoading } = usePermissions();
  
  // Ensure page starts at top
  useScrollToTop();

  // Date Range State
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(),
    to: new Date()
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>('today');
  const [showYearComparison, setShowYearComparison] = useState(false);

  // Payment Analytics State
  const [paymentAnalytics, setPaymentAnalytics] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    pendingPayments: 0,
    todayPaymentMethods: {} as {[key: string]: number},
    todayTransactions: [] as any[],
    outstandingPayments: [] as any[],
    outstandingPaymentsTotal: 0,
    // New fields for date range analytics
    customRangeRevenue: 0,
    customRangeTransactions: [] as any[],
    customRangeTransactionsTotal: 0,
    customRangePaymentMethods: {} as {[key: string]: number},
    lastYearRevenue: 0,
    lastYearComparison: 0
  });
  const [loadingPaymentAnalytics, setLoadingPaymentAnalytics] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [outstandingPage, setOutstandingPage] = useState(1)
  const [itemsPerPage] = useState(10);

  // Quick filter options
  const quickFilters = [
    { value: 'today', label: 'Today', icon: '📅' },
    { value: 'yesterday', label: 'Yesterday', icon: '📅' },
    { value: 'this-week', label: 'This Week', icon: '📅' },
    { value: 'last-week', label: 'Last Week', icon: '📅' },
    { value: 'this-month', label: 'This Month', icon: '📅' },
    { value: 'last-month', label: 'Last Month', icon: '📅' },
    { value: 'this-year', label: 'This Year', icon: '📅' },
    { value: 'last-year', label: 'Last Year', icon: '📅' },
    { value: 'custom', label: 'Custom Range', icon: '🎯' }
  ];

  // Apply quick filter
  const applyQuickFilter = (filter: string) => {
    setSelectedQuickFilter(filter);
    const today = new Date();
    
    switch (filter) {
      case 'today':
        setDateRange({ from: today, to: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case 'this-week':
        setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
        break;
      case 'last-week':
        const lastWeekStart = startOfWeek(subDays(today, 7));
        const lastWeekEnd = endOfWeek(subDays(today, 7));
        setDateRange({ from: lastWeekStart, to: lastWeekEnd });
        break;
      case 'this-month':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'this-year':
        setDateRange({ from: startOfYear(today), to: endOfYear(today) });
        break;
      case 'last-year':
        const lastYear = subYears(today, 1);
        setDateRange({ from: startOfYear(lastYear), to: endOfYear(lastYear) });
        break;
      case 'custom':
        // Keep current date range for custom
        break;
    }
  };

  // Load Payment Analytics with date range
  const loadPaymentAnalytics = async () => {
    if (!clinic?.id) return;
    
    setLoadingPaymentAnalytics(true);
    try {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      
      const [
        todayRevenue,
        monthlyRevenue,
        yearlyRevenue,
        pendingPayments,
        todayPaymentMethods,
        todayTransactions,
        outstandingPayments,
        customRangeRevenue,
        customRangeTransactions,
        customRangePaymentMethods,
        lastYearRevenue
      ] = await Promise.all([
        simplePaymentApi.getTodayRevenue(clinic.id),
        simplePaymentApi.getMonthlyRevenue(clinic.id),
        simplePaymentApi.getYearlyRevenue(clinic.id),
        simplePaymentApi.getPendingPaymentsTotal(clinic.id),
        simplePaymentApi.getTodayPaymentMethods(clinic.id),
        simplePaymentApi.getTodayTransactions(clinic.id),
        simplePaymentApi.getOutstandingPayments(clinic.id, outstandingPage, itemsPerPage),
        // New API calls for custom date range
        simplePaymentApi.getCustomRangeRevenue(clinic.id, fromDate, toDate),
        simplePaymentApi.getCustomRangeTransactions(clinic.id, fromDate, toDate, currentPage, itemsPerPage),
        simplePaymentApi.getCustomRangePaymentMethods(clinic.id, fromDate, toDate),
        // Last year comparison
        simplePaymentApi.getLastYearRevenue(clinic.id, dateRange.from.getFullYear() - 1)
      ]);

      // Calculate year comparison percentage
      const currentYearRevenue = yearlyRevenue;
      const lastYearRev = lastYearRevenue;
      const yearComparison = lastYearRev > 0 ? ((currentYearRevenue - lastYearRev) / lastYearRev) * 100 : 0;

      setPaymentAnalytics({
        todayRevenue,
        monthlyRevenue,
        yearlyRevenue,
        pendingPayments,
        todayPaymentMethods,
        todayTransactions,
        outstandingPayments: outstandingPayments.data || [],
        outstandingPaymentsTotal: outstandingPayments.total || 0,
        customRangeRevenue,
        customRangeTransactions: customRangeTransactions.data || [],
        customRangeTransactionsTotal: customRangeTransactions.total || 0,
        customRangePaymentMethods,
        lastYearRevenue: lastYearRev,
        lastYearComparison: yearComparison
      });
    } catch (error) {
      console.error('Error loading payment analytics:', error);
      toast.error('Failed to load payment analytics');
    } finally {
      setLoadingPaymentAnalytics(false);
    }
  };

  // Load data when date range changes
  useEffect(() => {
    if (clinic?.id && !clinicLoading) {
      setCurrentPage(1); // Reset to first page when date range changes
      setOutstandingPage(1); // Reset outstanding payments page
      loadPaymentAnalytics();
    }
  }, [clinic?.id, clinicLoading, dateRange]);

  // Load data when pagination changes
  useEffect(() => {
    if (clinic?.id && !clinicLoading) {
      loadPaymentAnalytics();
    }
  }, [currentPage, outstandingPage]);

  // Check permissions for staff access
  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      // Add a small delay to ensure permissions are loaded
      const timer = setTimeout(() => {
        if (isStaff && !hasPermission('access_payment_analytics')) {
          toast.error('You do not have permission to access Payment Analytics');
          navigate('/admin');
        }
      }, 500); // 500ms delay to ensure permissions are loaded
      
      return () => clearTimeout(timer);
    }
  }, [isStaff, hasPermission, clinicLoading, clinic?.id, navigate]);

  // Show loading while clinic data is being fetched or permissions are loading
  if (clinicLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <p className="text-slate-700 text-lg font-medium">
              {clinicLoading ? 'Loading clinic data...' : 'Loading permissions...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied for staff without permission (only after permissions are loaded)
  if (isStaff && !hasPermission('access_payment_analytics') && !clinicLoading && !permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-slate-700 mb-6">You do not have permission to access Payment Analytics.</p>
            <Button onClick={() => navigate('/admin')} variant="outline">
              Back to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="flex items-center gap-2 w-full md:w-auto justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Admin</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  💰 Payment Analytics
                </h1>
                <p className="text-slate-600 text-xs md:text-sm lg:text-base font-medium">
                  Financial insights and revenue tracking
                </p>
              </div>
            </div>
            <Button
              onClick={loadPaymentAnalytics}
              disabled={loadingPaymentAnalytics}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white w-full md:w-auto justify-center"
            >
              <RefreshCw className={`h-4 w-4 ${loadingPaymentAnalytics ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>
      </div>
      
      <main className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          {/* Date Range Filters */}
          <Card className="mb-8 bg-white border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-800 text-xl">📅 Date Range Filters</CardTitle>
              <CardDescription className="text-green-700">Select the time period for your analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Quick Filters */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Quick Filters</Label>
                  <Select value={selectedQuickFilter} onValueChange={applyQuickFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {quickFilters.map((filter) => (
                        <SelectItem key={filter.value} value={filter.value}>
                          <div className="flex items-center gap-2">
                            <span>{filter.icon}</span>
                            <span>{filter.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Custom Date Range</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              <span className="hidden sm:inline">
                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                              </span>
                              <span className="sm:hidden">
                                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                              </span>
                            </>
                          ) : (
                            <span className="hidden sm:inline">
                              {format(dateRange.from, "LLL dd, y")}
                            </span>
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                        <ChevronDown className="ml-auto h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={(range) => {
                          if (range?.from && range?.to) {
                            setDateRange(range);
                            setSelectedQuickFilter('custom');
                            setIsDatePickerOpen(false);
                          }
                        }}
                        numberOfMonths={window.innerWidth < 768 ? 1 : 2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Year Comparison Toggle */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Year Comparison</Label>
                  <Button
                    variant={showYearComparison ? "default" : "outline"}
                    onClick={() => setShowYearComparison(!showYearComparison)}
                    className="w-full"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{showYearComparison ? 'Hide' : 'Show'} Comparison</span>
                    <span className="sm:hidden">{showYearComparison ? 'Hide' : 'Show'}</span>
                  </Button>
                </div>

                {/* Selected Range Display */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Selected Range</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="hidden sm:inline">
                        {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                      </span>
                      <span className="sm:hidden">
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingPaymentAnalytics ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
                <p className="text-green-700 text-lg font-medium">Loading payment data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">Selected Range Revenue</p>
                        <p className="text-3xl font-bold text-green-800">₹{paymentAnalytics.customRangeRevenue.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">
                          {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">Transactions Count</p>
                        <p className="text-3xl font-bold text-blue-800">{paymentAnalytics.customRangeTransactions.length}</p>
                        <p className="text-xs text-blue-600 mt-1">Total transactions in period</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 mb-1">Payment Methods</p>
                        <p className="text-3xl font-bold text-purple-800">{Object.keys(paymentAnalytics.customRangePaymentMethods).length}</p>
                        <p className="text-xs text-purple-600 mt-1">Different methods used</p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 mb-1">Pending Payments</p>
                        <p className="text-3xl font-bold text-orange-800">₹{paymentAnalytics.pendingPayments.toLocaleString()}</p>
                        <p className="text-xs text-orange-600 mt-1">Amount still owed</p>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Year Comparison Card */}
              {showYearComparison && (
                <Card className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-indigo-800 text-xl">📊 Year Comparison</CardTitle>
                    <CardDescription className="text-indigo-700">Compare this year with last year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-white rounded-lg border border-indigo-200">
                        <p className="text-sm font-medium text-indigo-600 mb-2">This Year</p>
                        <p className="text-2xl font-bold text-indigo-800">₹{paymentAnalytics.yearlyRevenue.toLocaleString()}</p>
                        <p className="text-xs text-indigo-600 mt-1">{new Date().getFullYear()}</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-indigo-200">
                        <p className="text-sm font-medium text-indigo-600 mb-2">Last Year</p>
                        <p className="text-2xl font-bold text-indigo-800">₹{paymentAnalytics.lastYearRevenue.toLocaleString()}</p>
                        <p className="text-xs text-indigo-600 mt-1">{new Date().getFullYear() - 1}</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-indigo-200">
                        <p className="text-sm font-medium text-indigo-600 mb-2">Growth</p>
                        <p className={`text-2xl font-bold ${paymentAnalytics.lastYearComparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {paymentAnalytics.lastYearComparison >= 0 ? '+' : ''}{paymentAnalytics.lastYearComparison.toFixed(1)}%
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">Year over year</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Breakdown for Selected Range */}
              <Card className="mb-8 bg-white border-green-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-800 text-xl">
                    Payment Methods ({format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")})
                  </CardTitle>
                  <CardDescription className="text-green-700">Breakdown of payment methods for selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(paymentAnalytics.customRangePaymentMethods).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(paymentAnalytics.customRangePaymentMethods).map(([method, amount]) => (
                        <div key={method} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-sm">💳</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{method}</span>
                              <p className="text-xs text-gray-500">Payment method</p>
                            </div>
                          </div>
                          <span className="font-bold text-green-800 text-lg">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">💳</div>
                      <p className="text-lg font-medium mb-2">No Payment Methods Found</p>
                      <p className="text-sm">No payment transactions recorded for the selected period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transactions for Selected Range */}
              <Card className="mb-8 bg-white border-green-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-800 text-xl">
                    Transactions ({format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")})
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, paymentAnalytics.customRangeTransactionsTotal)} of {paymentAnalytics.customRangeTransactionsTotal} transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentAnalytics.customRangeTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {paymentAnalytics.customRangeTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-lg">💰</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">
                                {transaction.treatment_payments?.dental_treatments?.patients?.first_name} {transaction.treatment_payments?.dental_treatments?.patients?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {transaction.payment_method} • {transaction.payment_date} • {transaction.treatment_payments?.dental_treatments?.treatment_type}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-green-800 text-lg">₹{transaction.amount.toLocaleString()}</span>
                            <p className="text-xs text-gray-500">Transaction</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Pagination Controls */}
                      {paymentAnalytics.customRangeTransactionsTotal > itemsPerPage && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            Page {currentPage} of {Math.ceil(paymentAnalytics.customRangeTransactionsTotal / itemsPerPage)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => prev + 1)}
                              disabled={currentPage >= Math.ceil(paymentAnalytics.customRangeTransactionsTotal / itemsPerPage)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">💰</div>
                      <p className="text-lg font-medium mb-2">No Transactions Found</p>
                      <p className="text-sm">No payment transactions recorded for the selected period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Outstanding Payments */}
              <Card className="mb-8 bg-white border-orange-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-orange-800 text-xl">Outstanding Payments</CardTitle>
                  <CardDescription className="text-orange-700">
                    Showing {((outstandingPage - 1) * itemsPerPage) + 1} - {Math.min(outstandingPage * itemsPerPage, paymentAnalytics.outstandingPaymentsTotal)} of {paymentAnalytics.outstandingPaymentsTotal} outstanding payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentAnalytics.outstandingPayments.length > 0 ? (
                    <div className="space-y-4">
                      {paymentAnalytics.outstandingPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-orange-600 text-lg">⏳</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">
                                {payment.dental_treatments?.patients?.first_name} {payment.dental_treatments?.patients?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {payment.dental_treatments?.treatment_type} • {payment.dental_treatments?.patients?.phone}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-orange-800 text-lg">₹{payment.remaining_amount.toLocaleString()}</span>
                            <p className="text-xs text-gray-500">Outstanding</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Pagination Controls */}
                      {paymentAnalytics.outstandingPaymentsTotal > itemsPerPage && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            Page {outstandingPage} of {Math.ceil(paymentAnalytics.outstandingPaymentsTotal / itemsPerPage)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setOutstandingPage(prev => Math.max(1, prev - 1))}
                              disabled={outstandingPage === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setOutstandingPage(prev => prev + 1)}
                              disabled={outstandingPage >= Math.ceil(paymentAnalytics.outstandingPaymentsTotal / itemsPerPage)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">✅</div>
                      <p className="text-lg font-medium mb-2">No Outstanding Payments</p>
                      <p className="text-sm">All payments have been completed.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* No Data Message */}
              {paymentAnalytics.customRangeRevenue === 0 && 
               paymentAnalytics.todayRevenue === 0 && 
               paymentAnalytics.monthlyRevenue === 0 && (
                <Card className="bg-white border-gray-200 shadow-lg">
                  <CardContent className="p-16 text-center">
                    <div className="text-6xl mb-6">💰</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">No Payment Data Available</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Payment analytics will appear here once transactions are recorded. 
                      Start by adding payments to treatments in the patient management section.
                    </p>
                    <Button
                      onClick={() => navigate('/admin/patients')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Go to Patient Management
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPaymentAnalytics;
