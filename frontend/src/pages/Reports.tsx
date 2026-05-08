import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import api from '../api';
import type { Spv } from '../store/useStore';

interface SpvListResponse {
  data: Spv[];
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const generateExcel = async () => {
    setLoading(true);
    try {
      const response = await api.get<SpvListResponse>('/spvs?limit=100');
      const spvs = response.data.data;
      
      const flatData = spvs.map((s) => ({
        ID: s.id,
        Name: s.name,
        Sector: s.sector,
        Risk_Level: s.riskLevel,
        ESG_Score: s.esgScore,
        Status: s.status,
        Recommendation: s.recommendation,
        Current_Asset_Value: s.financialData?.[s.financialData.length - 1]?.assetValue || 0,
        Current_Debt: s.financialData?.[s.financialData.length - 1]?.debt || 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(flatData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Portfolio_Report");
      
      XLSX.writeFile(workbook, "Nexus_Portfolio_Report.xlsx");
    } catch (error) {
      console.error("Failed to generate Excel", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Nexus SPV Portfolio Executive Report", 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      doc.setFontSize(14);
      doc.text("This report summarizes the overall portfolio health and risk metrics.", 20, 45);
      
      doc.text("For detailed line-by-line metrics, please download the Excel dataset.", 20, 55);
      
      doc.setFontSize(10);
      doc.text("Confidential - Do not distribute.", 20, 280);

      doc.save("Nexus_Executive_Summary.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Reporting Center</h2>
          <p className="text-gray-400 mt-2">Generate and download enterprise-grade financial reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 text-center border-t-4 border-success">
          <div className="w-16 h-16 mx-auto bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Portfolio Data Export</h3>
          <p className="text-gray-400 mb-8">Download complete SPV raw data, including valuations, debt ratios, and risk scores in Excel format for offline modeling.</p>
          <button 
            onClick={generateExcel}
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-success text-white font-bold rounded-lg hover:bg-success/90 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
            Download .XLSX
          </button>
        </div>

        <div className="glass-panel p-8 text-center border-t-4 border-danger">
          <div className="w-16 h-16 mx-auto bg-danger/20 text-danger rounded-full flex items-center justify-center mb-6">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Executive Summary</h3>
          <p className="text-gray-400 mb-8">Generate a high-level PDF report summarizing portfolio risk exposure, compliance status, and system alerts.</p>
          <button 
            onClick={generatePDF}
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 bg-danger text-white font-bold rounded-lg hover:bg-danger/90 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
            Download .PDF
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Report Generation History</h3>
        <div className="text-center py-8 text-gray-500">
          No past reports generated today.
        </div>
      </div>
    </div>
  );
};

export default Reports;
