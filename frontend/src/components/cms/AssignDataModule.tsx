import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Layers,
  Database,
  Search,
  Filter,
  ArrowRight,
  Clock,
  ChevronRight,
  ShieldCheck,
  FileText,
  Trash2,
  Eye,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  fetchCmsApplications,
  validateApplicationData,
  importApplicationData,
  fetchImportHistory,
  fetchImportErrors,
  ValidationReport,
  ImportSummary,
} from '../../lib/api/applications.api';
import { useCms } from '../../context/CmsContext';

interface AssignDataModuleProps {
  initialAppId?: string;
  onNavigateToIncharges?: (appId: string) => void;
  onClose?: () => void;
}

export default function AssignDataModule({
  initialAppId,
  onNavigateToIncharges,
  onClose,
}: AssignDataModuleProps) {
  const { config } = useCms();

  // App Selection
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>(initialAppId || 'default');
  const [loadingApps, setLoadingApps] = useState(false);

  // Tabs: 'upload' | 'history'
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // Hierarchy Data Type Selection
  const [selectedLevel, setSelectedLevel] = useState<string>('VOTER');
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const [voterGroupSize, setVoterGroupSize] = useState<number>(100);

  // File & Raw Data States
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // Validation States
  const [validating, setValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'ERROR' | 'WARNING'>('ALL');
  const [previewSearch, setPreviewSearch] = useState('');

  // Import Execution States
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // History States
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load CMS applications on mount
  useEffect(() => {
    async function loadApps() {
      setLoadingApps(true);
      try {
        const apps = await fetchCmsApplications();
        setApplications(apps);
        if (apps.length > 0 && selectedAppId === 'default') {
          setSelectedAppId(apps[0].id || apps[0].configKey || 'default');
        }
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoadingApps(false);
      }
    }
    loadApps();
  }, []);

  // Load history when tab changes
  useEffect(() => {
    if (activeTab === 'history' && selectedAppId) {
      loadHistory();
    }
  }, [activeTab, selectedAppId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchImportHistory(selectedAppId);
      setHistoryJobs(data);
    } catch (err) {
      console.error('Failed to load import history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectedApp = useMemo(() => {
    return (
      applications.find((a) => a.id === selectedAppId || a.configKey === selectedAppId) ||
      applications[0] || { appName: config.organisationName || 'Kondapi Connect' }
    );
  }, [applications, selectedAppId, config]);

  // Handle Excel / CSV File Pick
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsParsing(true);
    setValidationReport(null);
    setImportResult(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        setRawRows(jsonRows);
        setIsParsing(false);

        // Run validation immediately
        runValidation(jsonRows);
      } catch (err: any) {
        setIsParsing(false);
        setImportError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // Run Pre-flight Validation
  const runValidation = async (rowsToValidate: any[]) => {
    if (!rowsToValidate || rowsToValidate.length === 0) return;
    setValidating(true);
    setImportError(null);
    try {
      const report = await validateApplicationData(selectedAppId, selectedLevel, rowsToValidate);
      setValidationReport(report);
    } catch (err: any) {
      setImportError(`Validation failed: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  // Execute Final Import
  const handleCommitImport = async () => {
    if (!rawRows || rawRows.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await importApplicationData(selectedAppId, {
        level: selectedLevel,
        rows: rawRows,
        importMode,
        voterGroupSize,
        fileName: file?.name || 'import.xlsx',
      });
      setImportResult(res);
    } catch (err: any) {
      setImportError(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    let headers: Record<string, string>[] = [];
    if (selectedLevel === 'VOTER') {
      headers = [
        {
          'Serial Number': '1',
          'Voter ID / EPIC': 'AP01009823',
          'Full Name': 'Ravi Kumar',
          'Relative Name': 'Venkata Rao',
          'Relation Type': 'FATHER',
          Gender: 'MALE',
          Age: '34',
          'House No': '4-12/A',
          'Mobile Number': '9876543210',
          Mandal: 'Kondapi',
          Village: 'Ponnaluru',
          'Booth Number': '101',
          '100-Voter Group': 'Group 1',
          Caste: 'BC-A',
          Profession: 'Agriculture',
          'Political Preference': 'TDP',
        },
        {
          'Serial Number': '2',
          'Voter ID / EPIC': 'AP01009824',
          'Full Name': 'Lakshmi Devi',
          'Relative Name': 'Ravi Kumar',
          'Relation Type': 'HUSBAND',
          Gender: 'FEMALE',
          Age: '31',
          'House No': '4-12/A',
          'Mobile Number': '9876543211',
          Mandal: 'Kondapi',
          Village: 'Ponnaluru',
          'Booth Number': '101',
          '100-Voter Group': 'Group 1',
          Caste: 'BC-A',
          Profession: 'Homemaker',
          'Political Preference': 'TDP',
        },
      ];
    } else if (selectedLevel === 'BOOTH') {
      headers = [
        {
          'Booth Number': '101',
          'Polling Station Name': 'ZPHS High School Main Hall',
          Village: 'Ponnaluru',
          Mandal: 'Kondapi',
          Constituency: selectedApp?.appName || 'Kondapi',
        },
        {
          'Booth Number': '102',
          'Polling Station Name': 'Panchayat Office Room 1',
          Village: 'Ponnaluru',
          Mandal: 'Kondapi',
          Constituency: selectedApp?.appName || 'Kondapi',
        },
      ];
    } else {
      headers = [
        {
          'Mandal Name': 'Kondapi',
          'Village Name': 'Ponnaluru',
          Constituency: selectedApp?.appName || 'Kondapi',
        },
      ];
    }

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${selectedApp?.appName || 'App'}_${selectedLevel}_Template.xlsx`);
  };

  // Download Error Report CSV
  const handleDownloadErrorReport = () => {
    if (!validationReport?.errors || validationReport.errors.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(validationReport.errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, `Import_Errors_${Date.now()}.csv`);
  };

  // Filtered preview rows
  const filteredPreview = useMemo(() => {
    if (!validationReport?.preview) return [];
    return validationReport.preview.filter((row) => {
      const matchStatus = statusFilter === 'ALL' || row.status === statusFilter;
      const matchSearch =
        previewSearch === '' ||
        row.epicNumber.toLowerCase().includes(previewSearch.toLowerCase()) ||
        row.name.toLowerCase().includes(previewSearch.toLowerCase()) ||
        row.mandal.toLowerCase().includes(previewSearch.toLowerCase()) ||
        row.village.toLowerCase().includes(previewSearch.toLowerCase()) ||
        row.booth.toLowerCase().includes(previewSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [validationReport, statusFilter, previewSearch]);

  return (
    <div className="min-h-screen bg-slate-900/95 text-slate-100 p-3 sm:p-6 font-['Inter',sans-serif] flex justify-center items-start">
      <div className="w-full max-w-7xl bg-slate-100 rounded-[28px] shadow-2xl border border-slate-300 overflow-hidden text-slate-900">
        {/* Header Ribbon */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                  CMS DATA INGESTION
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  PHASE 2
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white">
                Assign Data & Dynamic Hierarchy Ingestion
              </h1>
            </div>
          </div>

          {/* Application Selector */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Application:
              </span>
              <select
                value={selectedAppId}
                onChange={(e) => {
                  setSelectedAppId(e.target.value);
                  setValidationReport(null);
                  setImportResult(null);
                }}
                className="bg-transparent text-amber-400 font-black text-xs focus:outline-none cursor-pointer"
              >
                {applications.map((app) => (
                  <option key={app.id || app.configKey} value={app.id || app.configKey} className="bg-slate-900 text-white">
                    {app.appName || app.name || app.organisationName}
                  </option>
                ))}
              </select>
            </div>

            {onNavigateToIncharges && (
              <button
                onClick={() => onNavigateToIncharges(selectedAppId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
              >
                Assign Incharges <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Ingest New Roll
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Ingestion History
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Parent-Child Hierarchy Validation Active</span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-slate-50 min-h-[550px]">
          {activeTab === 'upload' ? (
            <div className="space-y-6">
              {/* Configuration Ribbon */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* 1. Hierarchy Level */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    1. Data Type / Hierarchy Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value);
                      setValidationReport(null);
                      setImportResult(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="VOTER">Voter Electoral Roll (Full Hierarchy)</option>
                    <option value="BOOTH">Polling Booths Master</option>
                    <option value="VILLAGE">Villages / Wards Master</option>
                    <option value="MANDAL">Mandals / Blocks Master</option>
                  </select>
                </div>

                {/* 2. Ingestion Mode */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    2. Ingestion Mode
                  </label>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="APPEND">Incremental Upsert (Safe Update)</option>
                    <option value="REPLACE">Full Overwrite (Purge & Replace)</option>
                  </select>
                </div>

                {/* 3. Micro-Cluster Size */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    3. Auto-Group Cluster Size
                  </label>
                  <select
                    value={voterGroupSize}
                    onChange={(e) => setVoterGroupSize(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value={50}>50 Voters / Cluster</option>
                    <option value={100}>100 Voters / Cluster (Standard VIAP)</option>
                    <option value={200}>200 Voters / Cluster</option>
                  </select>
                </div>

                {/* 4. Template Action */}
                <div className="flex flex-col justify-end pt-1">
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    Download Sample Excel
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-500 transition-colors text-center relative shadow-xs">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-1">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">
                    {file ? file.name : 'Drag & drop Excel (.xlsx, .xls) or CSV file here'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB — Click to select a different file`
                      : 'Electoral roll spreadsheets with Mandal, Village, Booth, and Voter records'}
                  </p>
                </div>
              </div>

              {isParsing && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 font-bold text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  Parsing spreadsheet in browser and generating pre-flight validation...
                </div>
              )}

              {importError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 font-bold text-xs">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  {importError}
                </div>
              )}

              {/* Validation Results Stage */}
              {validationReport && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Metric Ribbons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400">Total Rows</span>
                      <div className="text-xl font-black text-slate-900 mt-0.5">
                        {validationReport.totalRows}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 mt-0.5">Rows detected in file</div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-emerald-700">Valid Records</span>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">
                        {validationReport.validRows}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                        Ready for database commit
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/30 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-red-700">Errors Found</span>
                      <div className="text-xl font-black text-red-700 mt-0.5">
                        {validationReport.invalidRows}
                      </div>
                      <div className="text-[10px] font-bold text-red-600 mt-0.5">
                        {validationReport.invalidRows === 0 ? 'Zero blocking errors' : 'Requires correction'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-amber-700">Duplicates</span>
                      <div className="text-xl font-black text-amber-700 mt-0.5">
                        {validationReport.duplicateCount}
                      </div>
                      <div className="text-[10px] font-bold text-amber-600 mt-0.5">
                        Duplicate EPICs/Booths
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700">Filter Preview:</span>
                      {(['ALL', 'VALID', 'ERROR', 'WARNING'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                            statusFilter === st
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      {validationReport.errors.length > 0 && (
                        <button
                          onClick={handleDownloadErrorReport}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-black transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Error Report ({validationReport.errors.length})
                        </button>
                      )}

                      <button
                        onClick={handleCommitImport}
                        disabled={importing || validationReport.validRows === 0}
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                      >
                        {importing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting to DB...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Confirm & Ingest ({validationReport.validRows} Records)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Spreadsheet Verification Preview (Showing {filteredPreview.length} records)
                      </h4>
                      <div className="relative w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          placeholder="Search preview rows..."
                          value={previewSearch}
                          onChange={(e) => setPreviewSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Row</th>
                            <th className="py-2.5 px-3">EPIC / ID</th>
                            <th className="py-2.5 px-3">Voter Name</th>
                            <th className="py-2.5 px-3">Mandal</th>
                            <th className="py-2.5 px-3">Village</th>
                            <th className="py-2.5 px-3">Booth</th>
                            <th className="py-2.5 px-3">100-Group</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Validation Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredPreview.map((r) => (
                            <tr
                              key={r.rowNumber}
                              className={
                                r.status === 'ERROR'
                                  ? 'bg-red-50/40 hover:bg-red-50/70'
                                  : r.status === 'WARNING'
                                  ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                  : 'hover:bg-slate-50'
                              }
                            >
                              <td className="py-2 px-3 font-mono font-bold text-slate-500">#{r.rowNumber}</td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.epicNumber}</td>
                              <td className="py-2 px-3 font-bold text-slate-800">{r.name}</td>
                              <td className="py-2 px-3">{r.mandal}</td>
                              <td className="py-2 px-3">{r.village}</td>
                              <td className="py-2 px-3 font-mono font-bold">{r.booth}</td>
                              <td className="py-2 px-3">{r.voterGroup}</td>
                              <td className="py-2 px-3">
                                {r.status === 'VALID' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VALID
                                  </span>
                                )}
                                {r.status === 'WARNING' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> WARNING
                                  </span>
                                )}
                                {r.status === 'ERROR' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                                    <XCircle className="w-3 h-3 text-red-600" /> ERROR
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-600">{r.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Successful Import Summary Banner */}
              {importResult && (
                <div className="p-6 bg-white rounded-2xl border-2 border-emerald-500 shadow-md animate-fadeIn space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900">
                        Spreadsheet Successfully Ingested to Database!
                      </h3>
                      <p className="text-xs text-slate-500">
                        Job Reference: <span className="font-mono font-bold">{importResult.jobId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Rows</span>
                      <div className="text-lg font-black text-slate-900">{importResult.totalRows}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Successfully Added</span>
                      <div className="text-lg font-black text-emerald-700">{importResult.successCount}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">Records Updated</span>
                      <div className="text-lg font-black text-blue-700">{importResult.updatedCount}</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Skipped / Errors</span>
                      <div className="text-lg font-black text-amber-700">{importResult.errorCount}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    {onNavigateToIncharges && (
                      <button
                        onClick={() => onNavigateToIncharges(selectedAppId)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                      >
                        Proceed to Step 3: Assign Incharges <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Historical Import Jobs</h3>
                  <p className="text-xs text-slate-500">Audit trail of all voter roll and hierarchy spreadsheets processed</p>
                </div>
                <button
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="p-12 text-center text-slate-400 text-xs font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading history logs...
                </div>
              ) : historyJobs.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                  No previous import jobs recorded for this application.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Job ID</th>
                        <th className="py-3 px-4">Spreadsheet File</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Total Rows</th>
                        <th className="py-3 px-4">Success</th>
                        <th className="py-3 px-4">Errors</th>
                        <th className="py-3 px-4">Created By</th>
                        <th className="py-3 px-4">Date / Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {historyJobs.map((j) => (
                        <tr key={j.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-900">
                            {j.id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            {j.fileName}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                j.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : j.status === 'FAILED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {j.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold">{j.totalRows}</td>
                          <td className="py-3 px-4 font-bold text-emerald-700">{j.successCount}</td>
                          <td className="py-3 px-4 font-bold text-red-600">{j.errorCount}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {j.createdBy?.name || j.createdBy?.mobileNumber || 'System Admin'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(j.createdAt).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
