import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusBadgeClass(status) {
  const statusClasses = {
    'Pending': 'badge-pending',
    'In Progress': 'badge-in-progress',
    'Processing': 'badge-processing',
    'Ready': 'badge-ready',
    'Completed': 'badge-completed',
    'Rejected': 'badge-rejected',
  };
  return statusClasses[status] || 'badge-pending';
}

export function getStatusColor(status) {
  const colors = {
    'Pending': '#eab308',
    'In Progress': '#3b82f6',
    'Processing': '#8b5cf6',
    'Ready': '#06b6d4',
    'Completed': '#22c55e',
    'Rejected': '#ef4444',
  };
  return colors[status] || '#6b7280';
}

export async function exportAnalyticsToPDF(analytics, chartElements) {
  // Import jsPDF and html2canvas dynamically
  const { default: jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(128, 0, 0); // Maroon color
  pdf.text('Analytics Dashboard Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Add date
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Add summary statistics
  pdf.setFontSize(14);
  pdf.setTextColor(128, 0, 0);
  pdf.text('Summary Statistics', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  const stats = [
    `Total Transcript Requests: ${analytics?.total_requests || 0}`,
    `Pending Transcripts: ${analytics?.pending_requests || 0}`,
    `Completed Transcripts: ${analytics?.completed_requests || 0}`,
    `Total Recommendation Requests: ${analytics?.total_recommendation_requests || 0}`,
    `Pending Recommendations: ${analytics?.pending_recommendation_requests || 0}`,
    `Completed Recommendations: ${analytics?.completed_recommendation_requests || 0}`,
    `Overdue Transcripts: ${analytics?.overdue_requests || 0}`,
    `Overdue Recommendations: ${analytics?.overdue_recommendation_requests || 0}`,
  ];

  stats.forEach(stat => {
    pdf.text(stat, 20, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Add charts
  for (const [chartTitle, chartElement] of Object.entries(chartElements)) {
    if (chartElement && yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }

    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add chart title
        pdf.setFontSize(12);
        pdf.setTextColor(128, 0, 0);
        pdf.text(chartTitle, 20, yPosition);
        yPosition += 10;

        // Add chart image
        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, Math.min(imgHeight, 100));
        yPosition += Math.min(imgHeight, 100) + 15;
      } catch (error) {
        console.warn(`Failed to capture chart: ${chartTitle}`, error);
        pdf.setFontSize(10);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`Chart "${chartTitle}" could not be captured`, 20, yPosition);
        yPosition += 10;
      }
    }
  }

  // Save the PDF
  pdf.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportAnalyticsToCSV(analytics) {
  if (!analytics) return;

  const csvData = [
    ['Metric', 'Value'],
    ['Total Transcript Requests', analytics.total_requests || 0],
    ['Pending Transcripts', analytics.pending_requests || 0],
    ['In Progress Transcripts', analytics.in_progress_requests || 0],
    ['Processing Transcripts', analytics.processing_requests || 0],
    ['Ready Transcripts', analytics.ready_requests || 0],
    ['Completed Transcripts', analytics.completed_requests || 0],
    ['Rejected Transcripts', analytics.rejected_requests || 0],
    ['Overdue Transcripts', analytics.overdue_requests || 0],
    [''],
    ['Total Recommendation Requests', analytics.total_recommendation_requests || 0],
    ['Pending Recommendations', analytics.pending_recommendation_requests || 0],
    ['In Progress Recommendations', analytics.in_progress_recommendation_requests || 0],
    ['Completed Recommendations', analytics.completed_recommendation_requests || 0],
    ['Rejected Recommendations', analytics.rejected_recommendation_requests || 0],
    ['Overdue Recommendations', analytics.overdue_recommendation_requests || 0],
  ];

  // Add enrollment data if available
  if (analytics.requests_by_enrollment?.length > 0) {
    csvData.push([''], ['Transcripts by Enrollment Status', '']);
    analytics.requests_by_enrollment.forEach(item => {
      csvData.push([item.name, item.value]);
    });
  }

  // Add collection method data if available
  if (analytics.requests_by_collection_method?.length > 0) {
    csvData.push([''], ['Transcripts by Collection Method', '']);
    analytics.requests_by_collection_method.forEach(item => {
      csvData.push([item.name, item.value]);
    });
  }

  // Add staff workload data if available
  if (analytics.staff_workload?.length > 0) {
    csvData.push([''], ['Staff Workload', '']);
    analytics.staff_workload.forEach(item => {
      csvData.push([item.name, item.requests]);
    });
  }

  // Convert to CSV string
  const csvContent = csvData.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `analytics_data_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
