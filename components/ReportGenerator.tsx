"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface ReportGeneratorProps {
  title?: string;
}

export function ReportGenerator({ title = "Generate Reports" }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch report data
      const response = await fetch("/api/reports/pdf");

      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to generate report");
      }

      const reportData = result.data;

      // Dynamically import jspdf (client-side only)
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPos = 20;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
          return true;
        }
        return false;
      };

      // Header
      doc.setFontSize(24);
      doc.setTextColor(30, 58, 138); // Blue
      doc.text("Financial Intelligence Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Business Info
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128); // Gray
      doc.text(reportData.business.name, pageWidth / 2, yPos, { align: "center" });
      yPos += 6;
      doc.text(
        `Generated: ${new Date(reportData.business.generatedAt).toLocaleDateString()}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 15;

      // Financial Identity Score Section
      doc.setFillColor(239, 246, 255); // Light blue
      doc.rect(15, yPos, pageWidth - 30, 40, "F");
      yPos += 10;

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Financial Identity Score", 20, yPos);
      yPos += 10;

      doc.setFontSize(32);
      doc.setTextColor(37, 99, 235); // Blue
      doc.text(`${reportData.score.overall.toFixed(0)}`, 20, yPos);
      
      doc.setFontSize(14);
      doc.setTextColor(107, 114, 128);
      doc.text(`Grade: ${reportData.score.grade}`, 50, yPos - 5);
      doc.text(`${reportData.score.label}`, 50, yPos + 5);
      yPos += 20;

      checkPageBreak(50);

      // Score Components Table
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Score Breakdown", 15, yPos);
      yPos += 5;

      const componentsData = [
        ["Component", "Score", "Weight"],
        ["Positivity", reportData.score.components.positivity.toFixed(1), "30%"],
        ["Stability", reportData.score.components.stability.toFixed(1), "20%"],
        ["Growth", reportData.score.components.growth.toFixed(1), "20%"],
        ["Expense Control", reportData.score.components.expenseControl.toFixed(1), "15%"],
        ["Buffer", reportData.score.components.buffer.toFixed(1), "15%"],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [componentsData[0]],
        body: componentsData.slice(1),
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
      checkPageBreak(50);

      // Key Metrics Section
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Key Metrics", 15, yPos);
      yPos += 10;

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: "NGN",
          minimumFractionDigits: 0,
        }).format(amount);
      };

      const metricsData = [
        ["Metric", "Value"],
        ["Total Revenue", formatCurrency(reportData.revenue.total)],
        ["Total Expenses", formatCurrency(reportData.expenses.total)],
        ["Net Cashflow", formatCurrency(reportData.cashflow.net)],
        ["Revenue Consistency", `${reportData.revenue.consistency.toFixed(1)}%`],
        ["Expense Volatility", `${reportData.expenses.volatility.toFixed(1)}%`],
        ["Cashflow Buffer", `${reportData.cashflow.buffer.toFixed(0)} days`],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [metricsData[0]],
        body: metricsData.slice(1),
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
      checkPageBreak(50);

      // Monthly Revenue Table
      doc.setFontSize(14);
      doc.text("Monthly Revenue", 15, yPos);
      yPos += 5;

      const revenueData = [
        ["Month", "Revenue"],
        ...reportData.revenue.monthly.map((m: any) => [
          m.month,
          formatCurrency(m.totalRevenue),
        ]),
      ];

      autoTable(doc, {
        startY: yPos,
        head: [revenueData[0]],
        body: revenueData.slice(1),
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] }, // Green
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
      checkPageBreak(50);

      // Expense Breakdown
      doc.setFontSize(14);
      doc.text("Expense Breakdown by Category", 15, yPos);
      yPos += 5;

      const expenseData = [
        ["Category", "Amount", "Percentage"],
        ...Object.entries(reportData.expenses.breakdown).map(([category, amount]) => [
          category,
          formatCurrency(amount as number),
          `${(((amount as number) / reportData.expenses.total) * 100).toFixed(1)}%`,
        ]),
      ];

      autoTable(doc, {
        startY: yPos,
        head: [expenseData[0]],
        body: expenseData.slice(1),
        theme: "grid",
        headStyles: { fillColor: [239, 68, 68] }, // Red
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
      checkPageBreak(50);

      // Recent Transactions (last 20)
      doc.addPage();
      yPos = 20;
      doc.setFontSize(16);
      doc.text("Recent Transactions", 15, yPos);
      yPos += 5;

      const transactionsData = [
        ["Date", "Description", "Category", "Amount"],
        ...reportData.transactions.slice(0, 20).map((t: any) => [
          new Date(t.date).toLocaleDateString(),
          t.description.substring(0, 30),
          t.category,
          formatCurrency(t.amount),
        ]),
      ];

      autoTable(doc, {
        startY: yPos,
        head: [transactionsData[0]],
        body: transactionsData.slice(1),
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 },
      });

      // Footer on last page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        doc.text(
          "CreditLinker - Financial Intelligence Platform",
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );
      }

      // Save PDF
      doc.save(`financial-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/reports/csv");

      if (!response.ok) {
        throw new Error("Failed to export transactions");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("CSV export error:", err);
      setError(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-blue-600" size={24} />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Generate comprehensive financial reports for your business. PDF reports are
        bank-ready and include your Financial Identity Score, key metrics, and
        transaction history.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* PDF Report */}
        <button
          onClick={generatePDF}
          disabled={loading}
          className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="text-blue-600 animate-spin" size={32} />
          ) : (
            <FileText className="text-blue-600" size={32} />
          )}
          <div className="text-center">
            <p className="font-semibold text-gray-900">PDF Report</p>
            <p className="text-sm text-gray-500">Comprehensive financial report</p>
          </div>
        </button>

        {/* CSV Export */}
        <button
          onClick={downloadCSV}
          disabled={loading}
          className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="text-green-600 animate-spin" size={32} />
          ) : (
            <Download className="text-green-600" size={32} />
          )}
          <div className="text-center">
            <p className="font-semibold text-gray-900">CSV Export</p>
            <p className="text-sm text-gray-500">Transaction data export</p>
          </div>
        </button>
      </div>
    </div>
  );
}
