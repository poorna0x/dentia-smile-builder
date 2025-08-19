import { useEffect, useMemo, useState } from 'react';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { clearAdminSession } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.webp';
import { Switch } from '@/components/ui/switch';
import { isAdminLoggedIn } from '@/lib/auth';

const Admin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn()) navigate('/admin/login', { replace: true, state: { from: '/admin' } });
  }, [navigate]);

  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const tomorrowIso = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const sampleAppointments = [
    { id: 'APT-001', name: 'John Doe', phone: '555-0100', email: 'john@example.com', date: todayIso, time: '10:00 AM - 10:30 AM', status: 'Confirmed' },
    { id: 'APT-002', name: 'Jane Smith', phone: '555-0101', email: 'jane@example.com', date: todayIso, time: '11:30 AM - 12:00 PM', status: 'Cancelled' },
    { id: 'APT-003', name: 'Michael Lee', phone: '555-0102', email: 'michael@example.com', date: tomorrowIso, time: '02:00 PM - 02:30 PM', status: 'Confirmed' },
  ];

  type SchedulingSettings = {
    startTime: string;
    endTime: string;
    breakStart: string;
    breakEnd: string;
    slotIntervalMinutes: number;
    weeklyHolidays: number[]; // 0-6 (Sun-Sat)
    customHolidays: string[]; // ISO yyyy-MM-dd
    disabledAppointments: boolean;
  };

  const defaultSettings: SchedulingSettings = {
    startTime: '09:00',
    endTime: '20:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    slotIntervalMinutes: 30,
    weeklyHolidays: [],
    customHolidays: [],
    disabledAppointments: false,
  };

  const loadSettings = (): SchedulingSettings => {
    try {
      const raw = localStorage.getItem('clinicSchedulingSettings');
      if (!raw) return defaultSettings;
      const parsed = JSON.parse(raw);
      return {
        ...defaultSettings,
        ...parsed,
        slotIntervalMinutes: Number(parsed.slotIntervalMinutes) || defaultSettings.slotIntervalMinutes,
        weeklyHolidays: Array.isArray(parsed.weeklyHolidays) ? parsed.weeklyHolidays : defaultSettings.weeklyHolidays,
        customHolidays: Array.isArray(parsed.customHolidays) ? parsed.customHolidays : defaultSettings.customHolidays,
        disabledAppointments: Boolean(parsed.disabledAppointments),
      };
    } catch {
      return defaultSettings;
    }
  };

  const [settings, setSettings] = useState<SchedulingSettings>(loadSettings());

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleWeekday = (dayIndex: number) => {
    setSettings((prev) => {
      const exists = prev.weeklyHolidays.includes(dayIndex);
      const weeklyHolidays = exists
        ? prev.weeklyHolidays.filter((d) => d !== dayIndex)
        : [...prev.weeklyHolidays, dayIndex];
      return { ...prev, weeklyHolidays };
    });
  };

  const customDatesAsDate = settings.customHolidays
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()));

  const onCustomDatesChange = (dates?: Date[]) => {
    const formatted = (dates || []).map((d) => format(d, 'yyyy-MM-dd'));
    setSettings((s) => ({ ...s, customHolidays: formatted }));
  };

  useEffect(() => {
    localStorage.setItem('clinicSchedulingSettings', JSON.stringify(settings));
  }, [settings]);

  // Filters and metrics
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState(sampleAppointments);
  const filteredAppointments = useMemo(() => {
    const iso = filterDate ? format(filterDate, 'yyyy-MM-dd') : undefined;
    return appointments.filter((a) => !iso || a.date === iso);
  }, [appointments, filterDate]);

  const appointmentsTodayCount = useMemo(() => {
    return appointments.filter((a) => a.date === todayIso && a.status !== 'Cancelled').length;
  }, [appointments, todayIso]);

  const cancelledTodayCount = useMemo(() => {
    return appointments.filter((a) => a.date === todayIso && a.status === 'Cancelled').length;
  }, [appointments, todayIso]);

  // No backend: appointments remain local sample data

  return (
    <div className="min-h-screen">
      {/* Minimal Admin Header with Logo only */}
      <header className="sticky top-0 z-50 bg-primary">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <a href="/" className="flex items-center">
              <div className="w-15 h-14 rounded-full overflow-hidden mr-0">
                <img 
                  src={logo} 
                  alt="Jeshna Dental Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold ml-[-15px] text-primary-foreground">Jeshna</span>
            </a>
            <Button variant="outline" onClick={() => { clearAdminSession(); navigate('/admin/login', { replace: true }); }}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="py-10 lg:py-16">
        <div className="container mx-auto px-4 space-y-8">
          <div>
            <h1 className="heading-xl text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage appointments and clinic schedule.</p>
          </div>

          {/* Appointments Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointments Today</CardTitle>
                <CardDescription>Scheduled (excl. cancelled)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{appointmentsTodayCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cancelled Today</CardTitle>
                <CardDescription>Appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{cancelledTodayCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>Filter and review appointment details.</CardDescription>
              <div className="flex flex-wrap gap-2 items-center mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">{filterDate ? format(filterDate, 'PPP') : 'Filter by Date'}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" onClick={() => setFilterDate(undefined)}>Clear</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell>{appt.name}</TableCell>
                      <TableCell>{appt.phone}</TableCell>
                      <TableCell>{appt.email}</TableCell>
                      <TableCell>{appt.date}</TableCell>
                      <TableCell>{appt.time}</TableCell>
                      <TableCell>{appt.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Scheduling Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Settings</CardTitle>
              <CardDescription>Control the appointment window and slot generation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input id="startTime" type="time" value={settings.startTime} onChange={(e) => setSettings(s => ({ ...s, startTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" value={settings.endTime} onChange={(e) => setSettings(s => ({ ...s, endTime: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breakStart">Break Start</Label>
                    <Input id="breakStart" type="time" value={settings.breakStart} onChange={(e) => setSettings(s => ({ ...s, breakStart: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakEnd">Break End</Label>
                    <Input id="breakEnd" type="time" value={settings.breakEnd} onChange={(e) => setSettings(s => ({ ...s, breakEnd: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Slot Interval (minutes)</Label>
                  <Input id="interval" type="number" min={5} step={5} value={settings.slotIntervalMinutes}
                    onChange={(e) => setSettings(s => ({ ...s, slotIntervalMinutes: Math.max(5, Number(e.target.value) || 5) }))} />
                </div>

                <div className="space-y-2">
                  <Label>Weekly Holidays</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-between w-full">
                        {settings.weeklyHolidays.length > 0 ?
                          `Selected: ${settings.weeklyHolidays.sort((a,b)=>a-b).map(i => weekdayLabels[i]).join(', ')}` :
                          'Choose days'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="grid grid-cols-2 gap-2">
                        {weekdayLabels.map((label, idx) => (
                          <label key={idx} className="flex items-center gap-2">
                            <Checkbox checked={settings.weeklyHolidays.includes(idx)} onCheckedChange={() => toggleWeekday(idx)} />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Custom Holidays</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">Manage Custom Holidays</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <Calendar
                        mode="multiple"
                        selected={customDatesAsDate}
                        onSelect={onCustomDatesChange}
                        className="border rounded-md"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">Disable All Appointments</div>
                    <div className="text-sm text-muted-foreground">Temporarily stop all bookings</div>
                  </div>
                  <Switch checked={settings.disabledAppointments} onCheckedChange={(v) => setSettings(s => ({ ...s, disabledAppointments: Boolean(v) }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>Manage today's schedule</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="btn-appointment">New Appointment</Button>
                <Button size="sm" variant="outline">Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleAppointments.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell>{appt.id}</TableCell>
                      <TableCell>{appt.name}</TableCell>
                      <TableCell>{appt.date}</TableCell>
                      <TableCell>{appt.time}</TableCell>
                      <TableCell>{appt.status}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline">Edit</Button>
                          <Button size="sm" variant="destructive">Cancel</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;


