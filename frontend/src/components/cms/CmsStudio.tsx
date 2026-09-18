import React, { useState, useEffect } from 'react';
import {
  Building2,
  Flag,
  Palette,
  Layers,
  ToggleLeft,
  LayoutDashboard,
  Video,
  ListTodo,
  Megaphone,
  TrendingUp,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  ShieldCheck,
  X,
  Upload,
  Globe,
  Radio,
  Sliders,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  UserCheck,
  Download,
  Users,
  Search,
  Check,
  ArrowRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCms } from '../../context/CmsContext';
import { CmsParty, PARTY_PRESETS } from '../../lib/cms';
import { bulkImportVoters, fetchInchargesHierarchy, assignIncharge, InchargeHierarchyTree } from '../../lib/api';

interface CmsStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

type CmsTab =
  | 'data_assignment'
  | 'incharge_assignment'
  | 'organisation'
  | 'parties'
  | 'branding'
  | 'hierarchy'
  | 'features'
  | 'dashboard'
  | 'training'
  | 'tasks'
  | 'announcements'
  | 'analytics';

export default function CmsStudio({ isOpen, onClose }: CmsStudioProps) {
  const {
    config,
    parties,
    activeParty,
    applyPreset,
    updateConfig,
    updateFeatureToggles,
    updateHierarchyLabels,
    t,
    isFeatureEnabled,
  } = useCms();

  const [activeTab, setActiveTab] = useState<CmsTab>('data_assignment');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // --------------------------------------------------------------------------
  // DATA ASSIGNMENT (EXCEL UPLOAD) STATE
  // --------------------------------------------------------------------------
  const [selectedConstituency, setSelectedConstituency] = useState('Kondapi Assembly Constituency (AC No. 107)');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    constituencyName: string;
    totalProcessed: number;
    newVotersAdded: number;
    votersUpdated: number;
    mandalsCreated: number;
    villagesCreated: number;
    boothsCreated: number;
    voterGroupsCreated: number;
  } | null>(null);

  // --------------------------------------------------------------------------
  // INCHARGE ASSIGNMENT STATE
  // --------------------------------------------------------------------------
  const [inchargeTree, setInchargeTree] = useState<InchargeHierarchyTree | null>(null);
  const [isLoadingIncharges, setIsLoadingIncharges] = useState(false);
  const [inchargeSearchQuery, setInchargeSearchQuery] = useState('');
  const [selectedMandalFilter, setSelectedMandalFilter] = useState('ALL');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetUnit, setTargetUnit] = useState<{
    level: 'CONSTITUENCY' | 'MANDAL' | 'VILLAGE' | 'BOOTH' | 'VOTER_GROUP';
    id: string;
    name: string;
    parentName?: string;
    currentIncharge?: any;
  } | null>(null);
  const [assignForm, setAssignForm] = useState({
    userName: '',
    mobileNumber: '',
    role: 'VOTER_100_INCHARGE',
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Local form states
  const [orgForm, setOrgForm] = useState({
    name: config.organisationName,
    code: 'KDP-TDP-01',
    status: 'ACTIVE',
    contactEmail: 'central.command@politicalconnect.in',
    contactPhone: '+91 98480 12345',
    logoUrl: config.logoUrl || '',
    website: 'https://politicalconnect.in',
  });

  const [brandingForm, setBrandingForm] = useState({
    appName: config.organisationName,
    headerTitle: config.headerTitle || config.organisationName,
    slogan: config.slogan || '',
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    activePartyCode: config.activePartyCode,
    logoUrl: config.logoUrl || '',
  });

  const [hierarchyLabels, setHierarchyLabels] = useState(config.hierarchyLabels);
  const [features, setFeatures] = useState(config.featureToggles);

  // New Party Modal state
  const [newParty, setNewParty] = useState({
    name: '',
    code: '',
    shortName: '',
    primaryColor: '#6366f1',
    secondaryColor: '#1e293b',
    symbolName: 'Flag',
  });
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);

  // New Announcement state
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'HIGH',
    targetLevel: 'ALL',
  });

  // Load Incharges tree when tab is opened
  useEffect(() => {
    if (activeTab === 'incharge_assignment' && isOpen) {
      loadIncharges();
    }
  }, [activeTab, isOpen]);

  const loadIncharges = async () => {
    setIsLoadingIncharges(true);
    try {
      const data = await fetchInchargesHierarchy();
      setInchargeTree(data);
    } catch {
      // Fallback
    } finally {
      setIsLoadingIncharges(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'Serial No': 1,
        'EPIC Number': 'AP23107001',
        'Voter Name': 'Golla Venkata Rao',
        'Relative Name': 'Golla Ramaiah',
        'Relation Type': 'Father',
        'Gender': 'Male',
        'Age': 45,
        'House Number': '4-12/A',
        'Mobile Number': '9848011221',
        'Mandal': 'Kondapi',
        'Village': 'Kondapi Town',
        'Booth Number': 'Booth 101',
        'Voter Group': 'Team 1 (1-100)',
        'Caste': 'BC-D (Yadava)',
        'Profession': 'Agriculture',
        'Political Preference': 'TDP',
        'Location Status': 'Local',
        'Current Location': 'Local',
        'Remarks': 'Active TDP supporter, Booth Volunteer',
      },
      {
        'Serial No': 2,
        'EPIC Number': 'AP23107002',
        'Voter Name': 'Kondapalli Lakshmi',
        'Relative Name': 'Kondapalli Srinivas',
        'Relation Type': 'Husband',
        'Gender': 'Female',
        'Age': 38,
        'House Number': '4-12/B',
        'Mobile Number': '9848011222',
        'Mandal': 'Singarayakonda',
        'Village': 'Pakala',
        'Booth Number': 'Booth 185',
        'Voter Group': 'Team Pakala 1',
        'Caste': 'OC (Kamma)',
        'Profession': 'Teacher',
        'Political Preference': 'TDP',
        'Location Status': 'Local',
        'Current Location': 'Local',
        'Remarks': 'Community Women Leader',
      },
      {
        'Serial No': 3,
        'EPIC Number': 'AP23107003',
        'Voter Name': 'Chintala Ramesh',
        'Relative Name': 'Chintala Venkateswarlu',
        'Relation Type': 'Father',
        'Gender': 'Male',
        'Age': 29,
        'House Number': '2-88',
        'Mobile Number': '9848011223',
        'Mandal': 'Tangutur',
        'Village': 'Alakurapadu',
        'Booth Number': 'Booth 104',
        'Voter Group': 'Team AK-1',
        'Caste': 'SC (Madiga)',
        'Profession': 'Software Engineer',
        'Political Preference': 'Neutral',
        'Location Status': 'Migrated',
        'Current Location': 'Hyderabad',
        'Remarks': 'Requires travel coordination on Polling Day',
      },
      {
        'Serial No': 4,
        'EPIC Number': 'AP23107004',
        'Voter Name': 'Shaik Rahim',
        'Relative Name': 'Shaik Mastan',
        'Relation Type': 'Father',
        'Gender': 'Male',
        'Age': 52,
        'House Number': '7-14/1',
        'Mobile Number': '9848011224',
        'Mandal': 'Jarugumalli',
        'Village': 'Jarugumalli Village',
        'Booth Number': 'Booth 76',
        'Voter Group': 'Team JM-A',
        'Caste': 'BC-E (Muslim)',
        'Profession': 'Business',
        'Political Preference': 'TDP',
        'Location Status': 'Local',
        'Current Location': 'Local',
        'Remarks': 'Village Elder',
      },
      {
        'Serial No': 5,
        'EPIC Number': 'AP23107005',
        'Voter Name': 'Bandaru Anusha',
        'Relative Name': 'Bandaru Rajesh',
        'Relation Type': 'Husband',
        'Gender': 'Female',
        'Age': 26,
        'House Number': '1-45',
        'Mobile Number': '9848011225',
        'Mandal': 'Ponnaluru',
        'Village': 'Ponnaluru Village',
        'Booth Number': 'Booth 52',
        'Voter Group': 'Team PL-A',
        'Caste': 'BC-B',
        'Profession': 'Homemaker',
        'Political Preference': 'TDP',
        'Location Status': 'Local',
        'Current Location': 'Local',
        'Remarks': 'New young voter',
      },
      {
        'Serial No': 6,
        'EPIC Number': 'AP23107006',
        'Voter Name': 'Yerraguntla Subba Rao',
        'Relative Name': 'Yerraguntla Kotamma',
        'Relation Type': 'Mother',
        'Gender': 'Male',
        'Age': 61,
        'House Number': '5-22',
        'Mobile Number': '9848011226',
        'Mandal': 'Marripudi',
        'Village': 'Marripudi Village',
        'Booth Number': 'Booth 21',
        'Voter Group': 'Team MP-A',
        'Caste': 'OC (Reddy)',
        'Profession': 'Farmer',
        'Political Preference': 'YSRCP',
        'Location Status': 'Local',
        'Current Location': 'Local',
        'Remarks': 'Neutral lean, incharge outreach required',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kondapi_Voters');
    XLSX.writeFile(workbook, 'Kondapi_Constituency_Electoral_Roll_Template.xlsx');
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        if (!rawData || rawData.length === 0) {
          setUploadError('Excel sheet is empty or contains no records.');
          return;
        }

        const normalized = rawData.map((row: any, idx: number) => ({
          serialNumber: row['Serial No'] || row['serialNumber'] || row['SNo'] || idx + 1,
          epicNumber: String(row['EPIC Number'] || row['epicNumber'] || row['EPIC'] || row['Voter ID'] || `AP23107${String(idx + 100).padStart(4, '0')}`).trim(),
          name: String(row['Voter Name'] || row['Name'] || row['name'] || row['Full Name'] || 'Voter Name').trim(),
          fatherHusbandName: String(row['Relative Name'] || row['Father/Husband Name'] || row['fatherHusbandName'] || '').trim(),
          relationType: String(row['Relation Type'] || row['relationType'] || 'Father').trim(),
          gender: String(row['Gender'] || row['gender'] || 'Male').trim(),
          age: parseInt(String(row['Age'] || row['age'] || '35'), 10) || 35,
          houseNumber: String(row['House Number'] || row['houseNumber'] || row['Door No'] || '1-1').trim(),
          mobileNumber: String(row['Mobile Number'] || row['mobileNumber'] || row['Phone'] || '9848012345').trim(),
          mandal: String(row['Mandal'] || row['mandal'] || 'Kondapi').trim(),
          village: String(row['Village'] || row['village'] || 'Kondapi Town').trim(),
          boothNumber: String(row['Booth Number'] || row['boothNumber'] || row['Booth'] || 'Booth 101').trim(),
          voterGroup: String(row['Voter Group'] || row['voterGroup'] || row['Team'] || 'Team 1 (1-100)').trim(),
          caste: String(row['Caste'] || row['caste'] || 'General').trim(),
          profession: String(row['Profession'] || row['profession'] || 'Agriculture').trim(),
          politicalPreference: String(row['Political Preference'] || row['politicalPreference'] || 'TDP').trim(),
          voterLocationStatus: String(row['Location Status'] || row['voterLocationStatus'] || 'Local').trim(),
          currentLocation: String(row['Current Location'] || row['currentLocation'] || 'Local').trim(),
          notes: String(row['Remarks'] || row['notes'] || '').trim(),
        }));

        setParsedRows(normalized);
      } catch (err: any) {
        setUploadError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteUpload = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    setUploadError(null);
    setImportResult(null);

    try {
      const result = await bulkImportVoters('', parsedRows);
      setImportResult(result);
      setStatusMessage(`Successfully imported and assigned ${result.newVotersAdded + result.votersUpdated} voter records to ${result.constituencyName}!`);
      setTimeout(() => setStatusMessage(''), 6000);
      void loadIncharges();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and assign data');
    } finally {
      setIsImporting(false);
    }
  };

  const openAssignInchargeModal = (unit: {
    level: 'CONSTITUENCY' | 'MANDAL' | 'VILLAGE' | 'BOOTH' | 'VOTER_GROUP';
    id: string;
    name: string;
    parentName?: string;
    currentIncharge?: any;
  }) => {
    setTargetUnit(unit);
    let defaultRole = 'VOTER_100_INCHARGE';
    if (unit.level === 'CONSTITUENCY') defaultRole = 'CONSTITUENCY_INCHARGE';
    else if (unit.level === 'MANDAL') defaultRole = 'MANDAL_INCHARGE';
    else if (unit.level === 'VILLAGE') defaultRole = 'VILLAGE_INCHARGE';
    else if (unit.level === 'BOOTH') defaultRole = 'BOOTH_PRESIDENT';

    setAssignForm({
      userName: unit.currentIncharge?.userName || '',
      mobileNumber: unit.currentIncharge?.mobileNumber || '',
      role: unit.currentIncharge?.role || defaultRole,
    });
    setShowAssignModal(true);
  };

  const handleSaveInchargeAssignment = async () => {
    if (!targetUnit || !assignForm.userName || !assignForm.mobileNumber) return;
    setIsAssigning(true);

    try {
      await assignIncharge({
        unitLevel: targetUnit.level,
        unitId: targetUnit.id,
        role: assignForm.role,
        userName: assignForm.userName,
        mobileNumber: assignForm.mobileNumber,
      });

      setStatusMessage(`Assigned ${assignForm.userName} as ${assignForm.role} for ${targetUnit.name}!`);
      setShowAssignModal(false);
      setTimeout(() => setStatusMessage(''), 4000);
      void loadIncharges();
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    try {
      await updateConfig({
        organisationName: brandingForm.appName,
        headerTitle: brandingForm.headerTitle,
        slogan: brandingForm.slogan,
        primaryColor: brandingForm.primaryColor,
        secondaryColor: brandingForm.secondaryColor,
        accentColor: brandingForm.accentColor,
        activePartyCode: brandingForm.activePartyCode,
        logoUrl: brandingForm.logoUrl,
        hierarchyLabels,
        featureToggles: features,
      });

      setSaveStatus('saved');
      setStatusMessage('Configuration successfully saved and applied to entire application!');
      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage('');
      }, 3000);
    } catch (err) {
      setSaveStatus('idle');
      setStatusMessage('Failed to save settings.');
    }
  };

  const handlePresetSelect = async (presetId: string) => {
    await applyPreset(presetId);
    const preset = PARTY_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setBrandingForm((prev) => ({
        ...prev,
        appName: preset.appName,
        headerTitle: preset.appName,
        slogan: preset.slogan,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor: preset.accentColor,
        activePartyCode: preset.code,
        logoUrl: preset.logoUrl,
      }));
      setOrgForm((prev) => ({
        ...prev,
        name: preset.appName,
        logoUrl: preset.logoUrl,
      }));
      setStatusMessage(`Switched theme to ${preset.name}! All dashboard components adapted dynamically.`);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-6 animate-fade-in overflow-hidden">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* TOP BAR */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Political Connect CMS Studio</h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-yellow-400/20 text-yellow-300 rounded-full border border-yellow-400/30">
                  Global Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Single dynamic component system • Multi-tenant party & branding engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {statusMessage && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {statusMessage}
              </div>
            )}

            <button
              onClick={handleSaveAll}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save & Apply Changes
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LIVE THEME PREVIEW STRIP */}
        <div className="bg-slate-800/90 text-slate-300 px-5 py-2.5 flex items-center justify-between text-xs border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-yellow-400" /> Live Theme:
            </span>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-700">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: brandingForm.primaryColor }}
              />
              <span className="font-bold text-white">{brandingForm.activePartyCode}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300 font-medium">{brandingForm.appName}</span>
            </div>
          </div>

          {/* Quick Party Switcher in Preview Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick Presets:</span>
            {PARTY_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  brandingForm.activePartyCode === p.code
                    ? 'bg-yellow-400 text-slate-950 shadow-sm font-black'
                    : 'bg-slate-700/80 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.primaryColor }} />
                {p.code}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN STUDIO BODY (Tabs on left, Content on right) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR TABS */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto shrink-0">
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Core Constituency Workflow
            </div>

            <button
              onClick={() => setActiveTab('data_assignment')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'data_assignment'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm font-black'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>📥 1. Data Assignment (Excel)</span>
            </button>

            <button
              onClick={() => setActiveTab('incharge_assignment')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'incharge_assignment'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm font-black'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>👥 2. Incharge Assignment</span>
            </button>

            <div className="pt-2 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              CMS System & Branding
            </div>

            <button
              onClick={() => setActiveTab('branding')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'branding'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>3. Branding & Colors</span>
            </button>

            <button
              onClick={() => setActiveTab('organisation')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'organisation'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. Organisation</span>
            </button>

            <button
              onClick={() => setActiveTab('parties')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'parties'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>2. Political Parties</span>
            </button>

            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>4. Hierarchy & Labels</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'features'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <ToggleLeft className="w-4 h-4" />
              <span>5. Feature Toggles</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>6. Dashboard Layouts</span>
            </button>

            <button
              onClick={() => setActiveTab('training')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'training'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>7. Training Content</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>8. Task Templates</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'announcements'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>9. Announcements</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-yellow-400 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>10. Analytics Engine</span>
            </button>
          </div>

          {/* TAB CONTENT AREA */}
          <div className="flex-1 bg-white p-6 overflow-y-auto">
            
            {/* TAB 1: DATA ASSIGNMENT (EXCEL UPLOAD) */}
            {activeTab === 'data_assignment' && (
              <div className="space-y-6 animate-fade-in max-w-5xl">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        Constituency Data Assignment (Excel / Voter Roll Upload)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Upload official voter roll Excel/CSV files. The system automatically creates missing Mandals, Villages, Polling Booths, and Voter Groups, assigning all voter records to the selected Assembly Constituency in the live database.
                      </p>
                    </div>
                    <button
                      onClick={downloadSampleTemplate}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      Download Sample Excel Template
                    </button>
                  </div>
                </div>

                {/* CONSTITUENCY TARGET SELECTOR */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Target Assembly Constituency</label>
                    <select
                      value={selectedConstituency}
                      onChange={(e) => setSelectedConstituency(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="Kondapi Assembly Constituency (AC No. 107)">Kondapi Assembly Constituency (AC No. 107) - Prakasam District</option>
                      <option value="Ongole Assembly Constituency (AC No. 108)">Ongole Assembly Constituency (AC No. 108)</option>
                      <option value="Kandukur Assembly Constituency (AC No. 109)">Kandukur Assembly Constituency (AC No. 109)</option>
                      <option value="Santhanuthalapadu Assembly Constituency (AC No. 106)">Santhanuthalapadu Assembly Constituency (AC No. 106)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Assignment Mode</label>
                    <div className="px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Auto Hierarchy Auto-Sync
                    </div>
                  </div>
                </div>

                {/* UPLOAD DROPZONE */}
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-8 transition-all text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {uploadFile ? uploadFile.name : 'Choose or drop your Voter Roll Excel File (.xlsx, .xls, .csv)'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB — Ready to parse & assign` : 'Supports standard EC electoral roll spreadsheets with EPIC, Name, Mandal, Village, Booth, Caste, etc.'}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all active:scale-95">
                    <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
                    <span>Browse Excel / CSV File</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-700 font-semibold">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* IMPORT RESULT SUCCESS BANNER */}
                {importResult && (
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Data Assignment Completed for {importResult.constituencyName}!</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Processed</p>
                        <p className="text-base font-black text-slate-900">{importResult.totalProcessed}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-emerald-600">New Added</p>
                        <p className="text-base font-black text-emerald-600">{importResult.newVotersAdded}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-blue-600">Updated</p>
                        <p className="text-base font-black text-blue-600">{importResult.votersUpdated}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Mandals</p>
                        <p className="text-base font-black text-slate-800">{importResult.mandalsCreated}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Villages</p>
                        <p className="text-base font-black text-slate-800">{importResult.villagesCreated}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Booths</p>
                        <p className="text-base font-black text-slate-800">{importResult.boothsCreated}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Voter Groups</p>
                        <p className="text-base font-black text-slate-800">{importResult.voterGroupsCreated}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PARSED DATA PREVIEW & SUBMISSION */}
                {parsedRows.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Excel Data Preview ({parsedRows.length} Rows Detected)
                        </h4>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {Array.from(new Set(parsedRows.map((r) => r.mandal))).length} Mandals &bull; {Array.from(new Set(parsedRows.map((r) => r.boothNumber))).length} Booths
                        </span>
                      </div>

                      <button
                        onClick={handleExecuteUpload}
                        disabled={isImporting}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Importing & Assigning to Database...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Confirm & Assign All {parsedRows.length} Voters
                          </>
                        )}
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">S.No</th>
                            <th className="p-2.5">EPIC</th>
                            <th className="p-2.5">Voter Name</th>
                            <th className="p-2.5">Gender/Age</th>
                            <th className="p-2.5">Mandal</th>
                            <th className="p-2.5">Village</th>
                            <th className="p-2.5">Booth No</th>
                            <th className="p-2.5">Caste</th>
                            <th className="p-2.5">Preference</th>
                            <th className="p-2.5">Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedRows.slice(0, 15).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="p-2.5 font-medium text-slate-500">{row.serialNumber}</td>
                              <td className="p-2.5 font-bold text-slate-900">{row.epicNumber}</td>
                              <td className="p-2.5 font-semibold text-slate-800">{row.name}</td>
                              <td className="p-2.5 text-slate-600">{row.gender} &bull; {row.age}y</td>
                              <td className="p-2.5 font-medium text-slate-700">{row.mandal}</td>
                              <td className="p-2.5 text-slate-600">{row.village}</td>
                              <td className="p-2.5 font-semibold text-slate-800">{row.boothNumber}</td>
                              <td className="p-2.5 text-slate-600">{row.caste}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                  row.politicalPreference === 'TDP'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : row.politicalPreference === 'YSRCP'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {row.politicalPreference}
                                </span>
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                                  row.voterLocationStatus === 'Migrated'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {row.voterLocationStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedRows.length > 15 && (
                      <p className="text-[11px] text-slate-500 text-center italic">
                        Showing first 15 of {parsedRows.length} voter records. All {parsedRows.length} will be assigned on upload.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INCHARGE ASSIGNMENT */}
            {activeTab === 'incharge_assignment' && (
              <div className="space-y-6 animate-fade-in max-w-5xl">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                        Incharge Assignment Command Console
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Assign registered in-charges and booth presidents across all 5 administrative levels. Live database hierarchy scopes and logins are updated instantly.
                      </p>
                    </div>
                    <button
                      onClick={loadIncharges}
                      disabled={isLoadingIncharges}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingIncharges ? 'animate-spin' : ''}`} />
                      Refresh Incharge Tree
                    </button>
                  </div>
                </div>

                {/* HIERARCHY SCOPE CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Constituency Incharge</p>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {inchargeTree?.constituency?.incharge?.userName || 'Sri Bala Veeranjaneya Swamy'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ph: {inchargeTree?.constituency?.incharge?.mobileNumber || '9848012345'}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                    <p className="text-[10px] font-bold text-amber-700 uppercase">Mandal Incharges</p>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {inchargeTree?.mandals?.length || 6} Mandals Registered
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Kondapi, Singarayakonda, Tangutur...</p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Village Incharges</p>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {inchargeTree?.mandals?.reduce((acc, m) => acc + m.villages.length, 0) || 15} Gram Panchayats
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Assigned to Local Village Units</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl">
                    <p className="text-[10px] font-bold text-purple-700 uppercase">Booth Presidents</p>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {inchargeTree?.mandals?.reduce((acc, m) => acc + m.villages.reduce((vAcc, v) => vAcc + v.booths.length, 0), 0) || 19} Polling Booths
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">100-Voter Cluster Units Mapped</p>
                  </div>
                </div>

                {/* SEARCH & MANDAL FILTER */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 w-full sm:w-80 bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search unit or incharge name..."
                      value={inchargeSearchQuery}
                      onChange={(e) => setInchargeSearchQuery(e.target.value)}
                      className="w-full text-xs bg-transparent outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Filter Mandal:</span>
                    <button
                      onClick={() => setSelectedMandalFilter('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        selectedMandalFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All Mandals
                    </button>
                    {(inchargeTree?.mandals || [
                      { name: 'Kondapi' },
                      { name: 'Singarayakonda' },
                      { name: 'Tangutur' },
                      { name: 'Jarugumalli' },
                      { name: 'Ponnaluru' },
                      { name: 'Marripudi' }
                    ]).map((m: any) => (
                      <button
                        key={m.name}
                        onClick={() => setSelectedMandalFilter(m.name)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 ${
                          selectedMandalFilter === m.name
                            ? 'bg-yellow-400 text-slate-950 font-black shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* INCHARGE DIRECTORY MATRIX */}
                <div className="space-y-4">
                  {(inchargeTree?.mandals || [
                    { id: 'm1', name: 'Kondapi', totalVoters: 43200, villages: [
                      { id: 'v1', name: 'Kondapi Town', totalVoters: 3500, booths: [
                        { id: 'b1', boothNumber: 'Booth 101', totalVoters: 1000, voterGroups: [{ id: 'g1', name: 'Team 1 (1-100)', totalVoters: 100 }] }
                      ]}
                    ]},
                    { id: 'm2', name: 'Singarayakonda', totalVoters: 54100, villages: [
                      { id: 'v2', name: 'Pakala', totalVoters: 2800, booths: [
                        { id: 'b2', boothNumber: 'Booth 185', totalVoters: 950, voterGroups: [{ id: 'g2', name: 'Team Pakala 1', totalVoters: 100 }] }
                      ]}
                    ]},
                    { id: 'm3', name: 'Tangutur', totalVoters: 48900, villages: [
                      { id: 'v3', name: 'Alakurapadu', totalVoters: 3100, booths: [
                        { id: 'b3', boothNumber: 'Booth 104', totalVoters: 920, voterGroups: [{ id: 'g3', name: 'Team AK-1', totalVoters: 100 }] }
                      ]}
                    ]},
                    { id: 'm4', name: 'Jarugumalli', totalVoters: 29800, villages: [
                      { id: 'v4', name: 'Jarugumalli Village', totalVoters: 2400, booths: [
                        { id: 'b4', boothNumber: 'Booth 76', totalVoters: 880, voterGroups: [{ id: 'g4', name: 'Team JM-A', totalVoters: 100 }] }
                      ]}
                    ]},
                    { id: 'm5', name: 'Ponnaluru', totalVoters: 28400, villages: [
                      { id: 'v5', name: 'Ponnaluru Village', totalVoters: 2200, booths: [
                        { id: 'b5', boothNumber: 'Booth 52', totalVoters: 850, voterGroups: [{ id: 'g5', name: 'Team PL-A', totalVoters: 100 }] }
                      ]}
                    ]},
                    { id: 'm6', name: 'Marripudi', totalVoters: 23600, villages: [
                      { id: 'v6', name: 'Marripudi Village', totalVoters: 2100, booths: [
                        { id: 'b6', boothNumber: 'Booth 21', totalVoters: 800, voterGroups: [{ id: 'g6', name: 'Team MP-A', totalVoters: 100 }] }
                      ]}
                    ]},
                  ])
                    .filter((m: any) => selectedMandalFilter === 'ALL' || m.name === selectedMandalFilter)
                    .map((mandal: any) => (
                      <div key={mandal.id || mandal.name} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        {/* Mandal Header */}
                        <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide bg-amber-200 text-amber-900 rounded-lg">
                              MANDAL
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{mandal.name} Mandal</h4>
                              <p className="text-[11px] text-slate-500">
                                Assigned Incharge: <span className="font-semibold text-slate-800">{mandal.incharge?.userName || 'G. Srinivasulu'}</span> &bull; Ph: {mandal.incharge?.mobileNumber || '9848012345'}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => openAssignInchargeModal({
                              level: 'MANDAL',
                              id: mandal.id,
                              name: `${mandal.name} Mandal`,
                              currentIncharge: mandal.incharge,
                            })}
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            {mandal.incharge ? 'Change Incharge' : 'Assign Incharge'}
                          </button>
                        </div>

                        {/* Village and Booth Sub-Units */}
                        <div className="p-4 space-y-3 bg-white">
                          {mandal.villages?.map((village: any) => (
                            <div key={village.id || village.name} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded-md">
                                    VILLAGE (GP)
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">{village.name}</span>
                                  <span className="text-[11px] text-slate-500">
                                    &bull; Incharge: <span className="font-semibold text-slate-700">{village.incharge?.userName || 'Local Leader'}</span> ({village.incharge?.mobileNumber || '9848011221'})
                                  </span>
                                </div>

                                <button
                                  onClick={() => openAssignInchargeModal({
                                    level: 'VILLAGE',
                                    id: village.id,
                                    name: `${village.name} (GP)`,
                                    parentName: mandal.name,
                                    currentIncharge: village.incharge,
                                  })}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                                >
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  Assign GP Incharge
                                </button>
                              </div>

                              {/* Booths and 100-Voter Groups */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                {village.booths?.map((booth: any) => (
                                  <div key={booth.id || booth.boothNumber} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-900">{booth.boothNumber}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">({booth.voterGroups?.length || 1} Clusters)</span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 mt-0.5">
                                        President: <span className="font-semibold text-slate-700">{booth.incharge?.userName || 'Booth Agent'}</span> ({booth.incharge?.mobileNumber || '9848011222'})
                                      </p>
                                    </div>

                                    <button
                                      onClick={() => openAssignInchargeModal({
                                        level: 'BOOTH',
                                        id: booth.id,
                                        name: `${booth.boothNumber} (${village.name})`,
                                        parentName: village.name,
                                        currentIncharge: booth.incharge,
                                      })}
                                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                                    >
                                      <UserCheck className="w-3 h-3 text-purple-600" />
                                      Assign Booth Incharge
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                {/* ASSIGN INCHARGE MODAL */}
                {showAssignModal && targetUnit && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Assign Incharge Officer</h4>
                            <p className="text-xs text-slate-500">{targetUnit.name}</p>
                          </div>
                        </div>
                        <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Official Role Title</label>
                          <select
                            value={assignForm.role}
                            onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold"
                          >
                            <option value="CONSTITUENCY_INCHARGE">Constituency Incharge / MLA Candidate</option>
                            <option value="MANDAL_INCHARGE">Mandal Incharge / Mandal President</option>
                            <option value="VILLAGE_INCHARGE">Village Incharge / GP Coordinator</option>
                            <option value="BOOTH_PRESIDENT">Booth President / Polling Agent</option>
                            <option value="VOTER_100_INCHARGE">100-Voter Cluster Incharge</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Incharge Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g. K. Ramanjaneyulu"
                            value={assignForm.userName}
                            onChange={(e) => setAssignForm({ ...assignForm, userName: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Mobile Number (Login Mobile)</label>
                          <input
                            type="text"
                            placeholder="e.g. 9848012345"
                            value={assignForm.mobileNumber}
                            onChange={(e) => setAssignForm({ ...assignForm, mobileNumber: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                          />
                          <p className="text-[10px] text-slate-400">
                            This phone number will be used to log in via OTP to access this unit's dashboard.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setShowAssignModal(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveInchargeAssignment}
                          disabled={isAssigning || !assignForm.userName || !assignForm.mobileNumber}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isAssigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Confirm & Assign Incharge
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* TAB 3: BRANDING & THEME ENGINE */}
            {activeTab === 'branding' && (
              <div className="space-y-6 animate-fade-in max-w-4xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-yellow-600" />
                    Branding, Colors & Theme Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a ready-made party preset or customize HEX color variables. The entire frontend automatically adapts without any code modifications.
                  </p>
                </div>

                {/* Party Presets Grid */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    1-Click Party Theme Presets
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PARTY_PRESETS.map((p) => {
                      const isSelected = brandingForm.activePartyCode === p.code;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handlePresetSelect(p.id)}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between h-28 ${
                            isSelected
                              ? 'border-yellow-500 bg-yellow-50/50 shadow-md ring-2 ring-yellow-400/30'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-extrabold text-slate-900">{p.code}</span>
                              <div className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: p.primaryColor }} />
                                <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: p.secondaryColor }} />
                              </div>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{p.name}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md self-start ${isSelected ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-500'}`}>
                            {isSelected ? 'ACTIVE THEME' : 'Select Theme'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      Primary Theme Color
                      <span className="font-mono text-[11px] text-slate-500">{brandingForm.primaryColor}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandingForm.primaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                        className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandingForm.primaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      Secondary Brand Color
                      <span className="font-mono text-[11px] text-slate-500">{brandingForm.secondaryColor}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandingForm.secondaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                        className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandingForm.secondaryColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      Accent Action Color
                      <span className="font-mono text-[11px] text-slate-500">{brandingForm.accentColor}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandingForm.accentColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                        className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandingForm.accentColor}
                        onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Application Name</label>
                    <input
                      type="text"
                      value={brandingForm.appName}
                      onChange={(e) => setBrandingForm({ ...brandingForm, appName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      placeholder="e.g. Telangana Congress Seva Dal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Header Command Title</label>
                    <input
                      type="text"
                      value={brandingForm.headerTitle}
                      onChange={(e) => setBrandingForm({ ...brandingForm, headerTitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      placeholder="e.g. Kondapi Assembly Constituency"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Campaign Slogan / Tagline</label>
                    <input
                      type="text"
                      value={brandingForm.slogan}
                      onChange={(e) => setBrandingForm({ ...brandingForm, slogan: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      placeholder="e.g. Navaratnalu for Every Household / Praja Pragathi 2026"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Party Logo Image URL</label>
                    <input
                      type="text"
                      value={brandingForm.logoUrl}
                      onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: ORGANISATION MANAGEMENT */}
            {activeTab === 'organisation' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-yellow-600" />
                    Organisation Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure the top-level organisation entity for multi-tenant deployments.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Organisation Name</label>
                    <input
                      type="text"
                      value={orgForm.name}
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Organisation Code</label>
                    <input
                      type="text"
                      value={orgForm.code}
                      onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Official Email</label>
                    <input
                      type="email"
                      value={orgForm.contactEmail}
                      onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Helpline Phone Number</label>
                    <input
                      type="text"
                      value={orgForm.contactPhone}
                      onChange={(e) => setOrgForm({ ...orgForm, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Official Website</label>
                    <input
                      type="url"
                      value={orgForm.website}
                      onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: POLITICAL PARTY MANAGEMENT */}
            {activeTab === 'parties' && (
              <div className="space-y-6 animate-fade-in max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Flag className="w-5 h-5 text-yellow-600" />
                      Political Party Master
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage registered parties, their colors, abbreviations, and election survey symbols.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddPartyModal(true)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-yellow-400" /> Add Party
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Party Name</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Theme Color</th>
                        <th className="px-4 py-3">Symbol</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {parties.map((p) => (
                        <tr key={p.code} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: p.primaryColor }}
                              />
                              <span className="font-bold text-slate-900">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-600">{p.code}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{p.primaryColor}</td>
                          <td className="px-4 py-3 text-slate-600">{p.symbolName || 'Official Flag'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                              {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setBrandingForm((prev) => ({
                                  ...prev,
                                  activePartyCode: p.code,
                                  primaryColor: p.primaryColor,
                                }));
                                setStatusMessage(`Selected ${p.name} as primary active theme!`);
                                setTimeout(() => setStatusMessage(''), 3000);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-yellow-400 hover:text-slate-950 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Make Active
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: HIERARCHY & LABELS */}
            {activeTab === 'hierarchy' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-yellow-600" />
                    Hierarchy Level Nomenclature
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Rename geographic levels to match regional terminology (e.g. Mandal vs Tehsil vs Taluka vs Block).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  {Object.entries(hierarchyLabels).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 font-mono">{key} Label</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setHierarchyLabels({
                            ...hierarchyLabels,
                            [key]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Dependency Safety Guard Active:</span>
                    <p className="mt-0.5 text-amber-800">
                      Geographical records cannot be deleted if child units, voters, or cadre assignments are linked to them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: FEATURE TOGGLES */}
            {activeTab === 'features' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ToggleLeft className="w-5 h-5 text-yellow-600" />
                    Feature Modules & Toggles
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enable or disable specific features dynamically across the application dashboards.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(features).map(([key, enabled]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                    return (
                      <div
                        key={key}
                        onClick={() => setFeatures({ ...features, [key]: !enabled })}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          enabled
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                            : 'border-slate-200 bg-slate-50 opacity-75'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{label}</p>
                          <span className="text-[10px] text-slate-500">
                            {enabled ? 'Module Enabled' : 'Module Disabled'}
                          </span>
                        </div>

                        <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                          <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 6: DASHBOARD LAYOUTS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-yellow-600" />
                    Dashboard Role Visibility
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure dashboard cards and analytical section visibility per hierarchy level.
                  </p>
                </div>

                <div className="space-y-3">
                  {['CONSTITUENCY_INCHARGE', 'MANDAL_INCHARGE', 'VILLAGE_INCHARGE', 'BOOTH_PRESIDENT', 'VOTER_100_INCHARGE'].map((role) => (
                    <div key={role} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{role.replace('_', ' ')}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-400 text-slate-950 rounded">Full Access</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Configured with real-time turnout tracker, voter directory, caste breakdown, cadre operations, and live polling feed.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: TRAINING CMS */}
            {activeTab === 'training' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-yellow-600" />
                    Training Modules Catalog
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Create and publish cadre training videos, quiz assessments, and guides.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <span className="text-xs font-bold text-slate-800">Quick Upload New Video Module</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="Video Title" className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white" />
                    <input type="text" placeholder="Category (e.g. EVM Verification)" className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white" />
                    <input type="text" placeholder="YouTube Video ID / URL" className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white" />
                    <input type="text" placeholder="Duration (e.g. 12 mins)" className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white" />
                  </div>
                  <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-yellow-400" /> Publish Training Video
                  </button>
                </div>
              </div>
            )}

            {/* TAB 8: TASK CMS & TEMPLATES */}
            {activeTab === 'tasks' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-yellow-600" />
                    Task Templates & Dispatcher
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Campaign directives and survey task templates with 1-click dispatch to lower hierarchy tiers.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { title: 'Door-to-Door Voter Verification Blitz', level: '100-Voter Incharge', priority: 'HIGH' },
                    { title: 'Migrated Voter Transport & Bus Scheduling', level: 'Mandal Incharge', priority: 'URGENT' },
                    { title: 'Booth Polling Agent Mock Poll EVM Drill', level: 'Booth President', priority: 'HIGH' },
                  ].map((t, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{t.title}</p>
                        <span className="text-[10px] text-slate-500">Target: {t.level} • Priority: {t.priority}</span>
                      </div>
                      <button className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs rounded-lg shadow-xs cursor-pointer">
                        Dispatch Directive
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 9: ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-yellow-600" />
                    Live Announcements & Directives
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Broadcast high-priority notifications to field in-charges across the state hierarchy.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <input
                    type="text"
                    placeholder="Announcement Title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  />
                  <textarea
                    placeholder="Announcement Details & Directives..."
                    rows={3}
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  />
                  <button
                    onClick={() => {
                      setStatusMessage('Announcement broadcasted to all in-charges!');
                      setAnnouncementForm({ title: '', content: '', priority: 'HIGH', targetLevel: 'ALL' });
                      setTimeout(() => setStatusMessage(''), 3000);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-yellow-400" /> Broadcast Announcement
                  </button>
                </div>
              </div>
            )}

            {/* TAB 10: POLITICAL ANALYTICS ENGINE */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in max-w-3xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                    Political Analytics Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure election targets, majority marks, and swing calculation baselines.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Election Year</label>
                    <input type="number" defaultValue={2024} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Target Seats</label>
                    <input type="number" defaultValue={175} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Majority Mark</label>
                    <input type="number" defaultValue={88} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold" />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* BOTTOM STATUS FOOTER */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multi-tenant Dynamic Architecture Active</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close Studio
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Save All Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
