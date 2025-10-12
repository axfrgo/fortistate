/**
 * Export Utilities for Super Admin Dashboard
 * Provides functions to export data as CSV and JSON
 */

export interface ExportOptions {
  filename: string;
  format?: 'csv' | 'json';
  timestamp?: boolean;
}

/**
 * Convert array of objects to CSV format
 */
export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeaders = headers.join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) return '';
      
      // Handle objects (stringify them)
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Handle strings with commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Download data as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV or JSON
 */
export function exportData(data: any[], options: ExportOptions) {
  const { filename, format = 'csv', timestamp = true } = options;
  
  // Add timestamp to filename if requested
  const finalFilename = timestamp
    ? `${filename}_${new Date().toISOString().split('T')[0]}_${Date.now()}`
    : filename;
  
  if (format === 'csv') {
    const csv = convertToCSV(data);
    downloadFile(csv, `${finalFilename}.csv`, 'text/csv;charset=utf-8;');
  } else if (format === 'json') {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${finalFilename}.json`, 'application/json;charset=utf-8;');
  }
}

/**
 * Export users data
 */
export function exportUsers(users: any[]) {
  const formattedData = users.map(user => ({
    ID: user.id,
    Email: user.email,
    Role: user.role,
    Organization: user.organizationName || 'N/A',
    'Created At': new Date(user.createdAt).toLocaleString(),
    'Last Active': user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : 'Never',
    Status: user.isSuspended ? 'Suspended' : 'Active'
  }));
  
  exportData(formattedData, { filename: 'users_export' });
}

/**
 * Export organizations data
 */
export function exportOrganizations(organizations: any[]) {
  const formattedData = organizations.map(org => ({
    ID: org.id,
    Name: org.name,
    Plan: org.plan.toUpperCase(),
    Status: org.status.toUpperCase(),
    Users: org.userCount,
    Universes: org.universeCount,
    MRR: `$${org.mrr.toFixed(2)}`,
    'API Calls': org.apiCallCount,
    'Created At': new Date(org.createdAt).toLocaleString(),
    'Billing Cycle': org.billingCycle
  }));
  
  exportData(formattedData, { filename: 'organizations_export' });
}

/**
 * Export universes data
 */
export function exportUniverses(universes: any[]) {
  const formattedData = universes.map(universe => ({
    ID: universe.id,
    Name: universe.name,
    Organization: universe.organizationName,
    Status: universe.status.toUpperCase(),
    Entities: universe.entityCount,
    'State Size (KB)': universe.stateSize,
    'Law Violations': universe.lawViolations,
    'Total Operations': universe.totalOperations,
    'Created At': new Date(universe.createdAt).toLocaleString(),
    'Last Active': universe.lastActiveAt ? new Date(universe.lastActiveAt).toLocaleString() : 'Never'
  }));
  
  exportData(formattedData, { filename: 'universes_export' });
}

/**
 * Export security events data
 */
export function exportSecurityEvents(events: any[]) {
  const formattedData = events.map(event => ({
    ID: event.id,
    Type: event.type,
    Severity: event.severity.toUpperCase(),
    User: event.userEmail,
    Organization: event.organizationName,
    'IP Address': event.ipAddress,
    Message: event.message,
    Timestamp: new Date(event.timestamp).toLocaleString(),
    'User Agent': event.userAgent || 'N/A'
  }));
  
  exportData(formattedData, { filename: 'security_events_export' });
}

/**
 * Export AI usage data
 */
export function exportAIUsage(usage: any[]) {
  const formattedData = usage.map(record => ({
    ID: record.id,
    Organization: record.organizationName,
    Model: record.model,
    'Total Requests': record.totalRequests,
    'Success Rate': `${record.successRate.toFixed(1)}%`,
    'Avg Response Time': `${record.avgResponseTime.toFixed(0)}ms`,
    'Token Usage': record.tokenUsage,
    'Estimated Cost': `$${record.estimatedCost.toFixed(2)}`,
    'Period Start': new Date(record.periodStart).toLocaleString(),
    'Period End': new Date(record.periodEnd).toLocaleString()
  }));
  
  exportData(formattedData, { filename: 'ai_usage_export' });
}

/**
 * Export audit logs data
 */
export function exportAuditLogs(logs: any[]) {
  const formattedData = logs.map(log => ({
    ID: log.id,
    Action: log.action,
    Actor: log.actorEmail,
    Target: log.target || 'N/A',
    'Target ID': log.targetId || 'N/A',
    'IP Address': log.ipAddress,
    Timestamp: new Date(log.timestamp).toLocaleString(),
    Changes: log.changes ? JSON.stringify(log.changes) : 'N/A'
  }));
  
  exportData(formattedData, { filename: 'audit_logs_export' });
}

/**
 * Export revenue report
 */
export function exportRevenueReport(revenueData: any) {
  const formattedData = [
    {
      'Report Type': 'Revenue Overview',
      'Generated At': new Date().toLocaleString(),
      'Current MRR': `$${revenueData.currentMRR.toFixed(2)}`,
      'Current ARR': `$${revenueData.currentARR.toFixed(2)}`,
      'MRR Growth': `${revenueData.mrrGrowth.toFixed(1)}%`,
      'ARR Growth': `${revenueData.arrGrowth.toFixed(1)}%`,
      'Active Subscriptions': revenueData.activeSubscriptions,
      'Churned MRR': `$${revenueData.churnedMRR.toFixed(2)}`,
      'New MRR': `$${revenueData.newMRR.toFixed(2)}`,
      'Expansion MRR': `$${revenueData.expansionMRR.toFixed(2)}`
    }
  ];
  
  // Add plan breakdown
  if (revenueData.planBreakdown) {
    revenueData.planBreakdown.forEach((plan: any) => {
      formattedData.push({
        'Report Type': 'Plan Breakdown',
        'Plan': plan.plan.toUpperCase(),
        'Organizations': plan.count,
        'MRR': `$${plan.mrr.toFixed(2)}`,
        'ARR': `$${plan.arr.toFixed(2)}`,
        'Percentage': `${((plan.count / revenueData.activeSubscriptions) * 100).toFixed(1)}%`
      } as any);
    });
  }
  
  exportData(formattedData, { filename: 'revenue_report' });
}
