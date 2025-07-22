import React, { useState } from 'react';
import { 
  Home,
  Droplets,
  Truck,
  FileText,
  BarChart3,
  AlertTriangle,
  Users,
  Settings,
  Bell,
  LogOut,
  Gauge,
  Database,
  Activity,
  Package,
  Clipboard,
  Shield,
  Wrench,
  HardDrive,
  ChevronDown,
  Menu,
  X,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Zap,
  Thermometer,
  Wind,
  Scale,
  Radio,
  Ruler,
  Calculator,
  Table,
  Download,
  Loader2,
  Upload,
  Save,
  Edit3,
  Plus,
  Trash2,
  RefreshCw,
  Grid,
  LineChart,
  Eye
} from 'lucide-react';

// Type definitions for Tank Gauging System
interface Tank {
  id: string;
  tank_number: string;
  product: string;
  capacity: number;
  diameter?: number;
  height?: number;
  hasStrappingTable: boolean;
  lastCalibration?: string;
}

interface GaugingRecord {
  id: string;
  tank_id: string;
  gauge_time: string;
  level: number;
  temperature?: number;
  water_level: number;
  volume: number;
  calculated_volume: number;
  gauge_type: 'manual' | 'automatic';
  operator: string;
  variance?: number;
  notes?: string;
}

interface StrappingEntry {
  height: string;
  volume: number;
  quarterInch: string;
}

interface CalculatedVolume {
  volume: number;
  utilization: number;
}

// Mock data for Tank Gauging
const mockTanks: Tank[] = [
  { id: '1', tank_number: 'T-001', product: 'Crude Oil', capacity: 50000, diameter: 120, height: 32, hasStrappingTable: true, lastCalibration: '2024-01-15' },
  { id: '2', tank_number: 'T-002', product: 'Gasoline', capacity: 35000, diameter: 100, height: 28, hasStrappingTable: true, lastCalibration: '2024-02-20' },
  { id: '3', tank_number: 'T-003', product: 'Diesel', capacity: 40000, diameter: 110, height: 30, hasStrappingTable: false },
];

const mockGaugingHistory: GaugingRecord[] = [
  {
    id: '1',
    tank_id: '1',
    gauge_time: new Date(Date.now() - 3600000).toISOString(),
    level: 24.5,
    temperature: 68,
    water_level: 0.25,
    volume: 38500,
    calculated_volume: 38500,
    gauge_type: 'manual',
    operator: 'John Doe',
    notes: 'Routine morning gauge'
  },
  {
    id: '2',
    tank_id: '1',
    gauge_time: new Date(Date.now() - 7200000).toISOString(),
    level: 23.8,
    temperature: 67,
    water_level: 0.25,
    volume: 37200,
    calculated_volume: 37200,
    gauge_type: 'manual',
    operator: 'Jane Smith'
  },
];

const generateMockStrappingData = (): StrappingEntry[] => {
  const data: StrappingEntry[] = [];
  for (let i = 0; i <= 32; i += 0.25) {
    const height = i.toFixed(2);
    const volume = Math.floor((i / 32) * 50000);
    const quarterInch = ((i % 1) * 4).toString();
    data.push({ height, volume, quarterInch });
  }
  return data;
};

// Loading Spinner Component
const LoadingSpinner = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };
  
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
    </div>
  );
};

// Error Message Component
const ErrorMessage = ({ error, onRetry }: { error: string; onRetry?: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <div className="flex">
      <AlertTriangle className="h-5 w-5 text-red-400" />
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
        {onRetry && (
          <div className="mt-3">
            <button
              onClick={onRetry}
              className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Tank Gauging & Strapping System Component
const TankGaugingStrappingSystem = () => {
  const [activeTab, setActiveTab] = useState('manual-gauge');
  const [selectedTank, setSelectedTank] = useState('');
  const [editingStrapping, setEditingStrapping] = useState(false);
  const [newStrappingEntry, setNewStrappingEntry] = useState({ height: '', volume: '' });
  const [manualReading, setManualReading] = useState({
    level: '',
    temperature: '',
    waterLevel: '',
    observer: '',
    notes: ''
  });
  const [calculatedVolume, setCalculatedVolume] = useState<CalculatedVolume | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock data and functions
  const tanks = mockTanks;
  const gaugingHistory = mockGaugingHistory.filter(r => !selectedTank || r.tank_id === selectedTank);
  const strappingData = generateMockStrappingData();

  // Set default selected tank
  React.useEffect(() => {
    if (tanks.length > 0 && !selectedTank) {
      setSelectedTank(tanks[0].id);
    }
  }, [tanks, selectedTank]);

  // Calculate volume when level changes
  React.useEffect(() => {
    if (manualReading.level && selectedTank) {
      const tank = tanks.find(t => t.id === selectedTank);
      if (tank) {
        const height = tank.height || 32;
        const volume = Math.floor((parseFloat(manualReading.level) / height) * tank.capacity);
        const utilization = (volume / tank.capacity) * 100;
        setCalculatedVolume({ volume, utilization });
      }
    } else {
      setCalculatedVolume(null);
    }
  }, [manualReading.level, selectedTank, tanks]);

  const handleReadingChange = (field: string, value: string) => {
    setManualReading(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitGaugeReading = async () => {
    if (!manualReading.level || !manualReading.observer || !selectedTank) {
      alert('Please enter at least the level, observer, and select a tank');
      return;
    }

    setActionLoading('gauge');
    
    // Simulate API call
    setTimeout(() => {
      setManualReading({
        level: '',
        temperature: '',
        waterLevel: '',
        observer: '',
        notes: ''
      });
      setActionLoading(null);
      alert('Gauge reading recorded successfully');
    }, 1000);
  };

  const selectedTankData = tanks.find((t) => t.id === selectedTank);

  // Manual Gauging Tab
  const ManualGaugingTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Manual Tank Gauging</h3>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tank Selection</label>
              <select
                value={selectedTank}
                onChange={(e) => setSelectedTank(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select Tank</option>
                {tanks.map((tank) => (
                  <option key={tank.id} value={tank.id}>
                    {tank.tank_number} - {tank.product}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level (ft) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={manualReading.level}
                  onChange={(e) => handleReadingChange('level', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={manualReading.temperature}
                  onChange={(e) => handleReadingChange('temperature', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="68.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water Level (ft)</label>
              <input
                type="number"
                step="0.01"
                value={manualReading.waterLevel}
                onChange={(e) => handleReadingChange('waterLevel', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={manualReading.observer}
                onChange={(e) => handleReadingChange('observer', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Observer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={manualReading.notes}
                onChange={(e) => handleReadingChange('notes', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                placeholder="Additional notes or observations"
              />
            </div>

            <button
              onClick={submitGaugeReading}
              disabled={actionLoading === 'gauge' || !selectedTank}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {actionLoading === 'gauge' ? <LoadingSpinner size="small" /> : <Save className="h-4 w-4" />}
              <span>Record Gauge Reading</span>
            </button>
          </div>

          {/* Calculation Results */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Calculated Results</h4>
              
              {calculatedVolume !== null ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Volume:</span>
                    <span className="font-semibold text-lg">{calculatedVolume.volume.toLocaleString()} BBL</span>
                  </div>
                  
                  {manualReading.waterLevel && parseFloat(manualReading.waterLevel) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Water Volume:</span>
                        <span className="font-semibold text-red-600">Est. calculation needed</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Net Volume:</span>
                        <span className="font-semibold text-lg text-green-600">
                          {calculatedVolume.volume.toLocaleString()} BBL
                        </span>
                      </div>
                    </>
                  )}
                  
                  {manualReading.temperature && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <span className="font-semibold">{manualReading.temperature}°F</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Utilization:</span>
                    <span className="font-semibold">{calculatedVolume.utilization.toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Enter tank level to calculate volume</p>
                </div>
              )}
            </div>

            {/* Tank Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Tank Information</h4>
              {selectedTankData ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{selectedTankData.capacity.toLocaleString()} BBL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diameter:</span>
                    <span className="font-medium">{selectedTankData.diameter || 'N/A'} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Height:</span>
                    <span className="font-medium">{selectedTankData.height || 'N/A'} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{selectedTankData.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strapping Table:</span>
                    <span className={`font-medium ${selectedTankData.hasStrappingTable ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedTankData.hasStrappingTable ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Select a tank to view information</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gauging History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Gauge Readings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level (ft)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume (BBL)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temperature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Water Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gaugingHistory.map((reading) => (
                <tr key={reading.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reading.gauge_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reading.level.toFixed(2)}"
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reading.volume.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reading.temperature ? `${reading.temperature}°F` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reading.water_level > 0 ? `${reading.water_level.toFixed(2)}"` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reading.operator}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Strapping Table Tab
  const StrappingTableTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Tank Strapping Table</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setEditingStrapping(!editingStrapping)}
              disabled={!selectedTank}
              className={`px-4 py-2 rounded transition-colors flex items-center space-x-2 disabled:opacity-50 ${
                editingStrapping ? 'bg-gray-500 text-white' : 'bg-blue-500 text-white'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>{editingStrapping ? 'Stop Editing' : 'Edit Table'}</span>
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <label className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors flex items-center space-x-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Import</span>
              <input type="file" accept=".csv" className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strapping Table */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Tank: {selectedTankData?.tank_number || 'Select a tank'}</h4>
              <div className="text-sm text-gray-600">
                Total Entries: {strappingData.length} | 
                Range: {strappingData.length > 0 ? `${strappingData[0]?.height}" - ${strappingData[strappingData.length - 1]?.height}"` : 'N/A'}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Height (ft)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume (BBL)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      1/4 Inch
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {strappingData.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.height}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.volume.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {entry.quarterInch}/4
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Tank Info and Stats */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Tank Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tank ID:</span>
                  <span className="font-medium">{selectedTankData?.tank_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{selectedTankData?.product || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{selectedTankData?.capacity.toLocaleString() || 0} BBL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'manual-gauge':
        return <ManualGaugingTab />;
      case 'strapping-table':
        return <StrappingTableTab />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a tab to continue</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'manual-gauge', label: 'Manual Gauging', icon: Ruler },
              { id: 'strapping-table', label: 'Strapping Tables', icon: Table },
              { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
              { id: 'configuration', label: 'Configuration', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

// Main Dashboard Component
const IndustrialLoadingSystem = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, color: 'text-blue-600' },
    { id: 'tanks', name: 'Tanks', icon: Droplets, color: 'text-cyan-600' },
    { id: 'tank-gauging', name: 'Tank Gauging', icon: Ruler, color: 'text-indigo-600' },
    { id: 'loading-bays', name: 'Loading Bays', icon: Truck, color: 'text-green-600' },
    { id: 'transactions', name: 'Transactions', icon: FileText, color: 'text-purple-600' },
    { id: 'reports', name: 'Reports', icon: BarChart3, color: 'text-indigo-600' },
    { id: 'alarms', name: 'Alarms', icon: AlertTriangle, color: 'text-red-600' },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench, color: 'text-orange-600' },
    { id: 'compliance', name: 'Compliance', icon: Shield, color: 'text-yellow-600' },
    { id: 'plc-config', name: 'PLC Config', icon: Zap, color: 'text-pink-600' },
    { id: 'backup', name: 'Backup', icon: HardDrive, color: 'text-gray-600' },
    { id: 'users', name: 'Users', icon: Users, color: 'text-teal-600' },
  ];

  // Dashboard Module
  const DashboardModule = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Industrial Loading System</h1>
        <p className="text-blue-100">Welcome back, Operator. System status: All systems operational</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4" />
            <span>PLC Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="h-4 w-4" />
            <span>Real-time Monitoring Active</span>
          </div>
          <div className="flex items-center space-x-1">
            <Database className="h-4 w-4" />
            <span>Database Online</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveModule('tanks')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tanks</p>
              <p className="text-2xl font-semibold text-gray-900">10/12</p>
              <p className="text-sm text-gray-500 mt-1">2 alarms active</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">Utilization</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '83%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveModule('tank-gauging')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tank Gauging</p>
              <p className="text-2xl font-semibold text-gray-900">6</p>
              <p className="text-sm text-gray-500 mt-1">Readings today</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Ruler className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveModule('tank-gauging');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Go to Tank Gauging →
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveModule('transactions')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">45</p>
              <p className="text-sm text-gray-500 mt-1">3 pending</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from yesterday
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-semibold text-green-600">98%</p>
              <p className="text-sm text-gray-500 mt-1">All systems go</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => setActiveModule('tank-gauging')}
            className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center space-y-1"
          >
            <Gauge className="h-5 w-5 text-gray-600" />
            <span className="text-xs">Tank Gauge</span>
          </button>
          <button 
            onClick={() => setActiveModule('loading-bays')}
            className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center space-y-1"
          >
            <Truck className="h-5 w-5 text-gray-600" />
            <span className="text-xs">Start Loading</span>
          </button>
          <button 
            onClick={() => setActiveModule('reports')}
            className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center space-y-1"
          >
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="text-xs">Generate BOL</span>
          </button>
          <button 
            onClick={() => setActiveModule('reports')}
            className="p-3 border rounded-lg hover:bg-gray-50 flex flex-col items-center space-y-1"
          >
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <span className="text-xs">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Other placeholder modules
  const PlaceholderModule = ({ title, description }: { title: string; description: string }) => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'tank-gauging':
        return <TankGaugingStrappingSystem />;
      case 'tanks':
        return <PlaceholderModule title="Tank Management" description="Manage tank operations and monitoring" />;
      case 'loading-bays':
        return <PlaceholderModule title="Loading Bays Management" description="Track and manage truck, rail, and barge loading operations" />;
      case 'transactions':
        return <PlaceholderModule title="Transactions & BOL" description="Manage loading transactions and generate Bills of Lading" />;
      case 'reports':
        return <PlaceholderModule title="Reports & Analytics" description="Generate operational, compliance, and analytical reports" />;
      case 'alarms':
        return <PlaceholderModule title="Alarms & Notifications" description="Monitor and manage system alarms and notifications" />;
      case 'maintenance':
        return <PlaceholderModule title="Equipment Maintenance" description="Track maintenance schedules and equipment status" />;
      case 'compliance':
        return <PlaceholderModule title="Regulatory Compliance" description="Manage regulatory compliance and caustic handling procedures" />;
      case 'plc-config':
        return <PlaceholderModule title="PLC & Scale Configuration" description="Configure PLC connections and scale communications" />;
      case 'backup':
        return <PlaceholderModule title="System Backup & Recovery" description="Manage system backups and recovery procedures" />;
      case 'users':
        return <PlaceholderModule title="User Management" description="Manage user accounts and permissions" />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:transform-none`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-semibold">ILS Control</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="mt-8">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-800 transition-colors ${
                activeModule === item.id ? 'bg-gray-800 border-l-4 border-blue-500' : ''
              }`}
            >
              <item.icon className={`h-5 w-5 ${activeModule === item.id ? item.color : 'text-gray-400'}`} />
              <span className={`${activeModule === item.id ? 'text-white' : 'text-gray-300'}`}>{item.name}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-white">John Operator</p>
              <p className="text-xs text-gray-400">Senior Operator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {navigation.find(item => item.id === activeModule)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <span>John Operator</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button 
                      onClick={() => setActiveModule('users')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile Settings
                    </button>
                    <hr className="my-1" />
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

export default IndustrialLoadingSystem;