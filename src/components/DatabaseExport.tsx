import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Database, 
  FileText, 
  Users, 
  Calendar, 
  Settings, 
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useClinic } from '@/contexts/ClinicContext';
import JSZip from 'jszip';

interface TableInfo {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  description: string;
  estimatedRows?: number;
}

interface ExportStatus {
  [tableName: string]: {
    status: 'idle' | 'exporting' | 'completed' | 'error';
    progress?: number;
    error?: string;
  };
}

const DatabaseExport: React.FC = () => {
  const { clinic } = useClinic();
  const [exportStatus, setExportStatus] = useState<ExportStatus>({});
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);

  // Function to get icon based on table name
  const getTableIcon = (tableName: string) => {
    if (tableName.includes('patient')) return <Users className="h-4 w-4" />;
    if (tableName.includes('appointment') || tableName.includes('slot') || tableName.includes('schedule')) return <Calendar className="h-4 w-4" />;
    if (tableName.includes('setting') || tableName.includes('config')) return <Settings className="h-4 w-4" />;
    if (tableName.includes('payment') || tableName.includes('transaction')) return <Database className="h-4 w-4" />;
    if (tableName.includes('audit') || tableName.includes('log')) return <Activity className="h-4 w-4" />;
    if (tableName.includes('treatment') || tableName.includes('dental')) return <Database className="h-4 w-4" />;
    if (tableName.includes('clinic')) return <Database className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  // Function to get description based on table name
  const getTableDescription = (tableName: string) => {
    const descriptions: { [key: string]: string } = {
      // Core tables
      'clinics': 'Clinic information and settings',
      'patients': 'Patient records and information',
      'appointments': 'Appointment bookings and schedules',
      'patient_phones': 'Patient phone number records',
      'scheduling_settings': 'Clinic scheduling configuration',
      'disabled_slots': 'Disabled time slots and holidays',
      'system_settings': 'System configuration and feature toggles',
      'system_audit_log': 'System audit and change logs',
      'dental_treatments': 'Treatment types and pricing',
      'treatment_payments': 'Payment records for treatments',
      'payment_transactions': 'Detailed payment transaction logs',
      'tooth_images': 'Dental images and X-rays',
      'dentists': 'Dentist information and assignments',
      'staff_permissions': 'Staff access permissions',
      'feature_toggles': 'Feature enable/disable settings',
      'whatsapp_notifications': 'WhatsApp notification settings',
      'email_templates': 'Email notification templates',
      'prescriptions': 'Patient prescription records',
      'medical_history': 'Patient medical history',
      'lab_work': 'Laboratory work orders',
      'lab_work_payments': 'Lab work payment records',
      'fcm_tokens': 'Firebase Cloud Messaging tokens',
      'push_subscriptions': 'Push notification subscriptions',
      'captcha_logs': 'CAPTCHA verification logs',
      'security_logs': 'Security and access logs',
      'performance_logs': 'System performance metrics',
      'error_logs': 'Application error logs',
      'user_sessions': 'User session tracking',
      'api_usage': 'API usage statistics',
      'backup_logs': 'Database backup logs',
      'maintenance_logs': 'System maintenance records',
      
      // Auth and user management
      'auth_users': 'Authentication user records',
      'user_profiles': 'User profile information',
      'clinic_staff': 'Clinic staff members',
      'staff_roles': 'Staff role definitions',
      'role_permissions': 'Role-based permissions',
      
      // Patient data
      'patient_notes': 'Patient clinical notes',
      'treatment_plans': 'Treatment plan details',
      'treatment_history': 'Complete treatment history',
      'dental_records': 'Dental record information',
      'patient_consent': 'Patient consent records',
      'medical_alerts': 'Medical alert information',
      'allergies': 'Patient allergy records',
      'medications': 'Patient medication history',
      'insurance_info': 'Insurance information',
      'emergency_contacts': 'Emergency contact details',
      'family_history': 'Family medical history',
      'dental_history': 'Dental history records',
      
      // Images and media
      'xray_images': 'X-ray image records',
      'dental_charts': 'Dental chart data',
      'tooth_conditions': 'Tooth condition records',
      'treatment_photos': 'Treatment photo records',
      'before_after_images': 'Before/after treatment images',
      
      // Financial and billing
      'payment_methods': 'Payment method configurations',
      'invoice_items': 'Invoice line items',
      'invoices': 'Invoice records',
      'receipts': 'Receipt records',
      'refunds': 'Refund transaction records',
      'financial_reports': 'Financial reporting data',
      'revenue_analytics': 'Revenue analytics data',
      'expense_tracking': 'Expense tracking records',
      
      // Notifications and communications
      'appointment_reminders': 'Appointment reminder logs',
      'notification_settings': 'Notification configuration',
      'email_logs': 'Email communication logs',
      'sms_logs': 'SMS communication logs',
      'whatsapp_logs': 'WhatsApp communication logs',
      'push_notifications': 'Push notification records',
      'notification_templates': 'Notification template definitions',
      'patient_communications': 'Patient communication records',
      'message_history': 'Message history logs',
      'chat_logs': 'Chat conversation logs',
      
      // Lab and medical
      'lab_results': 'Laboratory test results',
      'lab_orders': 'Laboratory order records',
      'lab_reports': 'Laboratory report data',
      'lab_analytics': 'Laboratory analytics data',
      'consultation_notes': 'Consultation note records',
      'follow_up_appointments': 'Follow-up appointment records',
      'referrals': 'Patient referral records',
      'specialist_notes': 'Specialist consultation notes',
      
      // Inventory and equipment
      'inventory_items': 'Inventory item records',
      'supplies': 'Medical supply records',
      'equipment': 'Equipment records',
      'maintenance_schedule': 'Equipment maintenance schedule',
      
      // Scheduling and availability
      'room_bookings': 'Room booking records',
      'resource_allocations': 'Resource allocation data',
      'time_slots': 'Time slot definitions',
      'break_times': 'Break time schedules',
      'holiday_schedule': 'Holiday schedule data',
      'working_hours': 'Working hours configuration',
      'clinic_hours': 'Clinic operating hours',
      'availability': 'Staff availability records',
      
      // Patient flow
      'waitlist': 'Patient waitlist records',
      'cancellations': 'Appointment cancellation records',
      'reschedules': 'Appointment reschedule records',
      'no_shows': 'No-show appointment records',
      
      // Quality and feedback
      'patient_satisfaction': 'Patient satisfaction surveys',
      'reviews': 'Patient review records',
      'ratings': 'Service rating records',
      'feedback': 'Patient feedback records',
      'quality_metrics': 'Quality metric data',
      'performance_indicators': 'Performance indicator data',
      'kpi_tracking': 'KPI tracking records',
      
      // System and technical
      'audit_trails': 'System audit trail records',
      'change_logs': 'System change logs',
      'version_history': 'Version history records',
      'data_backups': 'Data backup records',
      'system_health': 'System health monitoring data',
      'monitoring_logs': 'System monitoring logs',
      'error_tracking': 'Error tracking data',
      'debug_logs': 'Debug log records',
      'api_requests': 'API request logs',
      'rate_limiting': 'Rate limiting data',
      'usage_statistics': 'Usage statistics data',
      'analytics_data': 'Analytics data records',
      'user_activity': 'User activity tracking',
      'session_logs': 'Session log records',
      'login_history': 'Login history records',
      'access_logs': 'Access log records',
      
      // Security and compliance
      'security_scans': 'Security scan results',
      'vulnerability_reports': 'Vulnerability assessment reports',
      'penetration_tests': 'Penetration test results',
      'security_events': 'Security event records',
      'threat_detection': 'Threat detection logs',
      'incident_reports': 'Security incident reports',
      'breach_logs': 'Data breach logs',
      'security_alerts': 'Security alert records',
      'access_violations': 'Access violation records',
      'permission_denials': 'Permission denial logs',
      'authentication_failures': 'Authentication failure logs',
      'authorization_errors': 'Authorization error logs',
      
      // Data management
      'patient_imports': 'Patient data import records',
      'data_migrations': 'Data migration logs',
      'sync_logs': 'Data synchronization logs',
      'integration_logs': 'Integration log records',
      'third_party_logs': 'Third-party integration logs',
      'webhook_logs': 'Webhook execution logs',
      'api_integrations': 'API integration records',
      'external_systems': 'External system connections',
      
      // Compliance and legal
      'gdpr_compliance': 'GDPR compliance records',
      'hipaa_compliance': 'HIPAA compliance records',
      'data_retention': 'Data retention policy records',
      'privacy_policies': 'Privacy policy records',
      'terms_of_service': 'Terms of service records',
      'user_agreements': 'User agreement records',
      'legal_documents': 'Legal document records',
      'compliance_reports': 'Compliance report records',
      
      // And many more...
      'treatment_categories': 'Treatment category definitions',
      'regulatory_compliance': 'Regulatory compliance records',
      'certification_logs': 'Certification log records',
      'license_tracking': 'License tracking data',
      'training_records': 'Training record data',
      'certification_expiry': 'Certification expiry tracking',
      'continuing_education': 'Continuing education records',
      'support_tickets': 'Support ticket records',
      'help_desk': 'Help desk records',
      'knowledge_base': 'Knowledge base articles',
      'faqs': 'Frequently asked questions',
      'documentation': 'System documentation',
      'reports_generated': 'Generated report records',
      'export_history': 'Export history logs',
      'import_history': 'Import history logs',
      'data_cleanup': 'Data cleanup logs',
      'archived_records': 'Archived record data',
      'deleted_records': 'Deleted record logs',
      'recovery_logs': 'Data recovery logs',
      'restore_history': 'Data restore history',
      'backup_verification': 'Backup verification logs',
      'integrity_checks': 'Data integrity check results',
      'data_validation': 'Data validation results',
      'quality_checks': 'Data quality check results',
      'duplicate_records': 'Duplicate record identification',
      'merge_history': 'Record merge history',
      'data_corrections': 'Data correction logs',
      'update_logs': 'Data update logs'
    };
    
    return descriptions[tableName] || `${tableName.replace(/_/g, ' ')} data`;
  };

  // Function to format table name for display
  const formatTableName = (tableName: string) => {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Load all tables from database
  const loadTables = async () => {
    try {
      setIsLoadingTables(true);
      
      // Only test the most basic tables that definitely exist in your system
      const basicTables = [
        'clinics', 'patients', 'appointments', 'patient_phones', 'scheduling_settings',
        'disabled_slots', 'system_settings', 'dental_treatments', 'treatment_payments', 
        'payment_transactions', 'tooth_images', 'dentists', 'staff_permissions', 
        'feature_toggles', 'prescriptions', 'lab_work'
      ];

      const availableTables: string[] = [];
      
      console.log('🔍 Starting basic table discovery...');
      
      // Test only basic tables to avoid 404 spam
      for (const tableName of basicTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!error) {
            availableTables.push(tableName);
            console.log(`✅ Found table: ${tableName}`);
          }
        } catch (e) {
          // Silently ignore errors - table doesn't exist
        }
      }

      console.log(`🎯 Total tables discovered: ${availableTables.length}`);
      console.log('📋 Tables found:', availableTables);

      const tableInfos: TableInfo[] = availableTables.map(tableName => ({
        name: tableName,
        displayName: formatTableName(tableName),
        icon: getTableIcon(tableName),
        description: getTableDescription(tableName)
      }));

      setTables(tableInfos);
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Failed to load database tables');
    } finally {
      setIsLoadingTables(false);
    }
  };

  // Load tables on component mount
  React.useEffect(() => {
    loadTables();
  }, []);

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle special characters and wrap in quotes if needed
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Create filename with clinic name
    const clinicName = clinic?.name || 'clinic';
    const sanitizedClinicName = clinicName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const finalFilename = `${sanitizedClinicName}_${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTable = async (tableName: string) => {
    try {
      setExportStatus(prev => ({
        ...prev,
        [tableName]: { status: 'exporting', progress: 0 }
      }));

      // Fetch all data from the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;

      setExportStatus(prev => ({
        ...prev,
        [tableName]: { status: 'exporting', progress: 50 }
      }));

      // Convert to CSV
      const csvContent = convertToCSV(data || []);
      
      setExportStatus(prev => ({
        ...prev,
        [tableName]: { status: 'exporting', progress: 90 }
      }));

      // Download the file
      downloadCSV(csvContent, tableName);

      setExportStatus(prev => ({
        ...prev,
        [tableName]: { status: 'completed' }
      }));

      toast.success(`${tableName} exported successfully!`);
    } catch (error) {
      console.error(`Error exporting ${tableName}:`, error);
      setExportStatus(prev => ({
        ...prev,
        [tableName]: { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Export failed' 
        }
      }));
      toast.error(`Failed to export ${tableName}`);
    }
  };

  const exportAllTables = async () => {
    setIsExportingAll(true);
    
    try {
      const zip = new JSZip();
      const exportPromises = tables.map(async (table) => {
        try {
          setExportStatus(prev => ({
            ...prev,
            [table.name]: { status: 'exporting', progress: 0 }
          }));

          // Fetch all data from the table
          const { data, error } = await supabase
            .from(table.name)
            .select('*');

          if (error) throw error;

          setExportStatus(prev => ({
            ...prev,
            [table.name]: { status: 'exporting', progress: 50 }
          }));

          // Convert to CSV
          const csvContent = convertToCSV(data || []);
          
          setExportStatus(prev => ({
            ...prev,
            [table.name]: { status: 'exporting', progress: 90 }
          }));

          // Add to ZIP with clinic name
          const clinicName = clinic?.name || 'clinic';
          const sanitizedClinicName = clinicName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const filename = `${sanitizedClinicName}_${table.name}_${new Date().toISOString().split('T')[0]}.csv`;
          zip.file(filename, csvContent);

          setExportStatus(prev => ({
            ...prev,
            [table.name]: { status: 'completed' }
          }));

          return { success: true, table: table.name };
        } catch (error) {
          console.error(`Error exporting ${table.name}:`, error);
          setExportStatus(prev => ({
            ...prev,
            [table.name]: { 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Export failed' 
            }
          }));
          return { success: false, table: table.name, error };
        }
      });

      // Wait for all exports to complete
      const results = await Promise.all(exportPromises);
      
      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create filename with clinic name
      const clinicName = clinic?.name || 'clinic';
      const sanitizedClinicName = clinicName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const zipFilename = `${sanitizedClinicName}_database_export_${new Date().toISOString().split('T')[0]}.zip`;
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      link.setAttribute('href', url);
      link.setAttribute('download', zipFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      if (errorCount === 0) {
        toast.success(`All ${successCount} tables exported successfully in ZIP file!`);
      } else {
        toast.success(`${successCount} tables exported successfully, ${errorCount} failed. Check individual exports for details.`);
      }
      
    } catch (error) {
      console.error('Error in bulk export:', error);
      toast.error('Bulk export failed');
    } finally {
      setIsExportingAll(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'exporting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'exporting':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Exporting...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Export
        </CardTitle>
        <CardDescription>
          Export all database tables as CSV files for backup and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export All Button */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <h3 className="font-semibold text-blue-800">Export All Tables</h3>
            <p className="text-sm text-blue-600">
              Download all database tables as a single ZIP file containing CSV files
            </p>
          </div>
          <Button
            onClick={exportAllTables}
            disabled={isExportingAll}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExportingAll ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating ZIP...
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Export All as ZIP
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Individual Table Exports */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Individual Table Exports</h3>
            <Button
              onClick={loadTables}
              disabled={isLoadingTables}
              variant="outline"
              size="sm"
            >
              {isLoadingTables ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="h-3 w-3 mr-1" />
                  Refresh Tables
                </>
              )}
            </Button>
          </div>
          
          {isLoadingTables ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Loading database tables...</p>
              </div>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">No tables found or failed to load tables</p>
              <Button onClick={loadTables} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tables.map((table) => {
              const status = exportStatus[table.name]?.status || 'idle';
              const progress = exportStatus[table.name]?.progress || 0;
              const error = exportStatus[table.name]?.error;

              return (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {table.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{table.displayName}</h4>
                      <p className="text-sm text-gray-600">{table.description}</p>
                      {error && (
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {status === 'exporting' && progress > 0 && (
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    
                    {getStatusIcon(status)}
                    {getStatusBadge(status)}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportTable(table.name)}
                      disabled={status === 'exporting'}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Export Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Export Information</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>{tables.length}</strong> tables discovered in your database</li>
            <li>• Individual exports: Files are downloaded in CSV format with UTF-8 encoding</li>
            <li>• Bulk export: All tables are packaged in a single ZIP file</li>
            <li>• Filenames include the current date (YYYY-MM-DD)</li>
            <li>• Special characters are properly escaped</li>
            <li>• Large tables may take a few seconds to export</li>
            <li>• All data is exported from the current database state</li>
            <li>• ZIP file contains individual CSV files for each table</li>
            <li>• Tables are automatically discovered from your Supabase database</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseExport;
