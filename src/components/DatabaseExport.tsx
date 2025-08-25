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
  const [exportStatus, setExportStatus] = useState<ExportStatus>({});
  const [isExportingAll, setIsExportingAll] = useState(false);

  const tables: TableInfo[] = [
    {
      name: 'clinics',
      displayName: 'Clinics',
      icon: <Database className="h-4 w-4" />,
      description: 'Clinic information and settings'
    },
    {
      name: 'patients',
      displayName: 'Patients',
      icon: <Users className="h-4 w-4" />,
      description: 'Patient records and information'
    },
    {
      name: 'appointments',
      displayName: 'Appointments',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Appointment bookings and schedules'
    },
    {
      name: 'patient_phones',
      displayName: 'Patient Phones',
      icon: <Users className="h-4 w-4" />,
      description: 'Patient phone number records'
    },
    {
      name: 'scheduling_settings',
      displayName: 'Scheduling Settings',
      icon: <Settings className="h-4 w-4" />,
      description: 'Clinic scheduling configuration'
    },
    {
      name: 'disabled_slots',
      displayName: 'Disabled Slots',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Disabled time slots and holidays'
    },
    {
      name: 'system_settings',
      displayName: 'System Settings',
      icon: <Settings className="h-4 w-4" />,
      description: 'System configuration and feature toggles'
    },
    {
      name: 'system_audit_log',
      displayName: 'Audit Logs',
      icon: <Activity className="h-4 w-4" />,
      description: 'System audit and change logs'
    },
    {
      name: 'dental_treatments',
      displayName: 'Dental Treatments',
      icon: <Database className="h-4 w-4" />,
      description: 'Treatment types and pricing'
    },
    {
      name: 'treatment_payments',
      displayName: 'Treatment Payments',
      icon: <Database className="h-4 w-4" />,
      description: 'Payment records for treatments'
    },
    {
      name: 'payment_transactions',
      displayName: 'Payment Transactions',
      icon: <Database className="h-4 w-4" />,
      description: 'Detailed payment transaction logs'
    }
  ];

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
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
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

          // Add to ZIP
          const filename = `${table.name}_${new Date().toISOString().split('T')[0]}.csv`;
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
      const zipFilename = `database_export_${new Date().toISOString().split('T')[0]}.zip`;
      
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
          <h3 className="font-semibold text-gray-900">Individual Table Exports</h3>
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
        </div>

        {/* Export Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Export Information</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Individual exports: Files are downloaded in CSV format with UTF-8 encoding</li>
            <li>• Bulk export: All tables are packaged in a single ZIP file</li>
            <li>• Filenames include the current date (YYYY-MM-DD)</li>
            <li>• Special characters are properly escaped</li>
            <li>• Large tables may take a few seconds to export</li>
            <li>• All data is exported from the current database state</li>
            <li>• ZIP file contains individual CSV files for each table</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseExport;
