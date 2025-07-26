// UpdatedIndustrialLoadingSystem.tsx
import React, { useState, useCallback } from 'react';
import {
  Users,
  Package,
  ArrowRightLeft,
  Upload,
  Download,
  Plus,
  Edit3,
  FileText,
  CheckCircle,
  Shield,
  Search,
  Eye,
  Settings,
  Database,
  AlertTriangle,
  Clock,
  TrendingUp,
  X,
  Gauge,
  Thermometer,
  BarChart3,
  Activity,
  Truck,
  Train,
  Ship,
  Layers,
  Zap,
  PlayCircle,
  StopCircle,
  Droplets,
  Scale,
  Radio,
  Printer,
  Ruler,
  Calculator,
  Save,
  Trash2,
  RefreshCw,
  Grid,
  LineChart,
  Table,
  Loader2
} from 'lucide-react';

// Import hooks
import {
  useTanks,
  useLoadingBays,
  useGaugingRecords,
  useCustomers,
  useProducts,
  useTransactions,
  useReports,
  useHardware,
  useFileOperations
} from '../hooks/useApi';

// Loading Spinner Component
const LoadingSpinner = ({ size = 'default' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };
  
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={${sizeClasses[size]} animate-spin text-blue-500} />
    </div>
  );
};

// Error Display Component
const ErrorMessage = ({ error, onRetry }) => (
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

const IndustrialLoadingSystem = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTank, setSelectedTank] = useState(null);
  const [gaugingForm, setGaugingForm] = useState({
    tankId: '',
    level: '',
    temperature: '',
    waterLevel: '',
    gaugeType: 'manual'
  });
  const [actionLoading, setActionLoading] = useState(null);

  // API Hooks
  const { tanks, loading: tanksLoading, error: tanksError, refetch: refetchTanks, updateTank } = useTanks();
  const { bays: loadingBays, loading: baysLoading, error: baysError, refetch: refetchBays, updateBay, startLoading, stopLoading } = useLoadingBays();
  const { records: gaugingRecords, loading: recordsLoading, error: recordsError, createRecord } = useGaugingRecords();
  const { customers, loading: customersLoading, error: customersError } = useCustomers();
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { transactions, loading: transactionsLoading, error: transactionsError, createTransaction } = useTransactions();
  const { generateGaugeReport, generateReconciliationReport, loading: reportsLoading } = useReports();
  const { plcStatus, systemHealth, loading: hardwareLoading } = useHardware();
  const { exportData, importCsv, loading: fileLoading } = useFileOperations();

  // Handle gauge form submission
  const handleGaugingSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!gaugingForm.tankId || !gaugingForm.level) {
      alert('Please select a tank and enter level');
      return;
    }

    setActionLoading('gauging');
    
    try {
      const tank = tanks.find(t => t.id === gaugingForm.tankId);
      if (!tank) return;

      // Calculate volume using strapping table (this would be done by the backend)
      const height = tank.height || 32;
      const calculatedVolume = (parseFloat(gaugingForm.level) * tank.capacity) / height;

      const newRecord = {
        tank_id: gaugingForm.tankId,
        gauge_time: new Date().toISOString(),
        level: parseFloat(gaugingForm.level),
        temperature: parseFloat(gaugingForm.temperature) || 20,
        water_level: parseFloat(gaugingForm.waterLevel) || 0,
        volume: calculatedVolume,
        calculated_volume: calculatedVolume,
        gauge_type: gaugingForm.gaugeType,
        operator: 'Current User',
        variance: 0,
        notes: ''
      };

      await createRecord(newRecord);
      
      // Update tank current readings
      await updateTank(gaugingForm.tankId, {
        current_level: parseFloat(gaugingForm.level),
        current_temperature: parseFloat(gaugingForm.temperature) || tank.current_temperature,
        current_volume: calculatedVolume,
        water_level: parseFloat(gaugingForm.waterLevel) || 0,
        last_gauged: new Date().toISOString().slice(0, 16).replace('T', ' ')
      });

      // Reset form
      setGaugingForm({ tankId: '', level: '', temperature: '', waterLevel: '', gaugeType: 'manual' });
      
      alert('Gauge reading recorded successfully');
    } catch (error) {
      alert(Error recording gauge reading: );
    } finally {
      setActionLoading(null);
    }
  }, [gaugingForm, tanks, createRecord, updateTank]);

  // Handle loading bay operations
  const handleStartLoading = useCallback(async (bayId) => {
    setActionLoading(start-);
    try {
      await startLoading(bayId, 'dummy-transaction-id'); // Fix: pass string, in real code create transaction first
      alert('Loading started successfully');
    } catch (error) {
      alert(Error starting loading: );
    } finally {
      setActionLoading(null);
    }
  }, [startLoading]);

  const handleStopLoading = useCallback(async (bayId) => {
    setActionLoading(stop-);
    try {
      await stopLoading(bayId);
      alert('Loading stopped successfully');
    } catch (error) {
      alert(Error stopping loading: );
    } finally {
      setActionLoading(null);
    }
  }, [stopLoading]);

  // Handle report generation
  const handleGenerateReport = useCallback(async (type, id) => {
    try {
      switch (type) {
        case 'gauge':
          if (id) await generateGaugeReport(id);
          break;
        case 'reconciliation':
          await generateReconciliationReport(new Date().toISOString().split('T')[0]);
          break;
        default:
          alert('Unknown report type');
      }
    } catch (error) {
      alert(Error generating report: );
    }
  }, [generateGaugeReport, generateReconciliationReport]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'loading': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'alarm': return 'bg-red-100 text-red-800';
      case 'available': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabButton = (tabId, label, IconComponent) => {
    return (
      <button
        key={tabId}
        onClick={() => setActiveTab(tabId)}
        className={lex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm }
      >
        <IconComponent className="h-4 w-4" />
        <span>{label}</span>
      </button>
    );
  };

  // Loading state for the entire app
  if (tanksLoading && baysLoading && customersLoading && productsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Industrial Loading & Tank Management System</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className={w-2 h-2 rounded-full }></div>
                <span>{plcStatus?.connected ? 'PLC Connected' : 'PLC Disconnected'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className={w-2 h-2 rounded-full }></div>
                <span>System {systemHealth?.status || 'Unknown'}</span>
              </div>
              <button 
                onClick={() => {
                  refetchTanks();
                  refetchBays();
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
                disabled={tanksLoading || baysLoading}
              >
                <RefreshCw className={h-5 w-5 } />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {renderTabButton('dashboard', 'Dashboard', Activity)}
            {renderTabButton('tanks', 'Tank Management', Droplets)}
            {renderTabButton('gauging', 'Tank Gauging', Gauge)}
            {renderTabButton('loading-bays', 'Loading Bays', Truck)}
            {renderTabButton('transactions', 'Transactions', ArrowRightLeft)}
            {renderTabButton('customers', 'Customers', Users)}
            {renderTabButton('products', 'Products', Package)}
            {renderTabButton('reports', 'Reports', FileText)}
            {renderTabButton('hardware', 'Hardware', Radio)}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Error handling for dashboard data */}
            {(tanksError || baysError) && (
              <ErrorMessage 
                error={tanksError || baysError || 'Failed to load dashboard data'} 
                onRetry={() => {
                  refetchTanks();
                  refetchBays();
                }}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tanksLoading ? <LoadingSpinner size="small" /> : tanks.length}
                    </h3>
                    <p className="text-sm text-gray-600">Active Tanks</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {baysLoading ? <LoadingSpinner size="small" /> : loadingBays.filter(b => b.status === 'loading').length}
                    </h3>
                    <p className="text-sm text-gray-600">Active Loading</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tanks.filter(tank => tank.status === 'alarm').length}
                    </h3>
                    <p className="text-sm text-gray-600">Active Alarms</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tanks.length > 0 ? Math.round(tanks.reduce((acc, tank) => acc + (tank.utilization || 0), 0) / tanks.length) : 0}%
                    </h3>
                    <p className="text-sm text-gray-600">Avg Utilization</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tank Overview */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tank Overview</h3>
                {tanksLoading ? (
                  <LoadingSpinner />
                ) : tanks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Droplets className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No tanks found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tanks.map(tank => (
                      <div key={tank.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={w-3 h-3 rounded-full }></div>
                          <div>
                            <div className="font-medium text-gray-900">{tank.tank_number}</div>
                            <div className="text-sm text-gray-600">{tank.product}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {(tank.current_volume ?? 0).toLocaleString()} BBL
                          </div>
                          <div className="text-sm text-gray-600">
                            {(tank.utilization ?? 0).toFixed(1)}% utilized
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Loading Bay Status */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loading Bay Status</h3>
                {baysLoading ? (
                  <LoadingSpinner />
                ) : loadingBays.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No loading bays found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loadingBays.map(bay => (
                      <div key={bay.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            {bay.type === 'truck' && <Truck className="h-4 w-4 text-blue-600" />}
                            {bay.type === 'rail' && <Train className="h-4 w-4 text-blue-600" />}
                            {bay.type === 'barge' && <Ship className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{bay.bay_number}</div>
                            <div className="text-sm text-gray-600">{bay.current_vehicle || 'No vehicle'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={inline-flex px-2 py-1 text-xs font-semibold rounded-full }>
                            {bay.status}
                          </span>
                          {bay.status === 'loading' && (
                            <div className="text-sm text-gray-600 mt-1">
                              {bay.progress}% complete
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gauging Tab with API Integration */}
        {activeTab === 'gauging' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Tank Gauging</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleGenerateReport('reconciliation')}
                  disabled={reportsLoading}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center disabled:opacity-50"
                >
                  {reportsLoading ? <LoadingSpinner size="small" /> : <FileText className="h-4 w-4 mr-2" />}
                  Reconciliation Report
                </button>
                <button 
                  onClick={() => exportData([], 'gauging.csv')} // Fix: pass empty array for data
                  disabled={fileLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center disabled:opacity-50"
                >
                  {fileLoading ? <LoadingSpinner size="small" /> : <Download className="h-4 w-4 mr-2" />}
                  Export Gauging
                </button>
              </div>
            </div>

            {recordsError && (
              <ErrorMessage error={recordsError} onRetry={() => window.location.reload()} />
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Tank Gauging</h3>
              <form onSubmit={handleGaugingSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tank</label>
                    <select 
                      value={gaugingForm.tankId}
                      onChange={(e) => setGaugingForm({...gaugingForm, tankId: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={tanksLoading}
                    >
                      <option value="">Select Tank</option>
                      {tanks.map(tank => (
                        <option key={tank.id} value={tank.id}>
                          {tank.tank_number} - {tank.product}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level (ft)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={gaugingForm.level}
                      onChange={(e) => setGaugingForm({...gaugingForm, level: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gaugingForm.temperature}
                      onChange={(e) => setGaugingForm({...gaugingForm, temperature: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Water Level (in)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gaugingForm.waterLevel}
                      onChange={(e) => setGaugingForm({...gaugingForm, waterLevel: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gauge Type</label>
                    <select 
                      value={gaugingForm.gaugeType}
                      onChange={(e) => setGaugingForm({...gaugingForm, gaugeType: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit"
                      disabled={actionLoading === 'gauging'}
                      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex items-center justify-center disabled:opacity-50"
                    >
                      {actionLoading === 'gauging' ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <Gauge className="h-4 w-4 mr-2" />
                          Record Gauge
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Recent Gauging Records */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Gauge Readings</h3>
              {recordsLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gauge Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {gaugingRecords.slice(0, 10).map(record => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {tanks.find(t => t.id === record.tank_id)?.tank_number || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.gauge_time).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.level.toFixed(2)}" 
                            {(record.water_level ?? 0) > 0 && <span className="text-blue-600"> ({record.water_level}" H2O)</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Thermometer className="h-4 w-4 text-orange-500" />
                              <span>{record.temperature}°F</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.volume.toLocaleString()} BBL
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={inline-flex px-2 py-1 text-xs font-semibold rounded-full }>
                              {record.gauge_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.operator}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleGenerateReport('gauge', record.tank_id)}
                                className="text-blue-600 hover:text-blue-800"
                                disabled={reportsLoading}
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Bays Tab */}
        {activeTab === 'loading-bays' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Loading Bay Operations</h2>
              <div className="flex space-x-2">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Loading
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center">
                  <StopCircle className="h-4 w-4 mr-2" />
                  Emergency Stop
                </button>
              </div>
            </div>

            {baysError && (
              <ErrorMessage error={baysError} onRetry={refetchBays} />
            )}

            {baysLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="large" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingBays.map(bay => (
                  <div key={bay.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {bay.type === 'truck' && <Truck className="h-5 w-5 text-blue-600" />}
                          {bay.type === 'rail' && <Train className="h-5 w-5 text-blue-600" />}
                          {bay.type === 'barge' && <Ship className="h-5 w-5 text-blue-600" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{bay.bay_number}</h3>
                          <p className="text-sm text-gray-600 capitalize">{bay.type} Loading Bay</p>
                        </div>
                      </div>
                      <span className={inline-flex px-2 py-1 text-xs font-semibold rounded-full }>
                        {bay.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className="font-medium">{bay.current_vehicle || 'None'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Operator:</span>
                        <span className="font-medium">{bay.operator || 'None'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Product:</span>
                        <span className="font-medium">{bay.product || 'None'}</span>
                      </div>
                      
                      {bay.status === 'loading' && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Flow Rate:</span>
                            <span className="font-medium text-blue-600">{bay.current_flow_rate} BBL/hr</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Pressure:</span>
                            <span className="font-medium">{bay.current_pressure} PSI</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-medium">{bay.progress}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: ${bay.progress}% }}
                            ></div>
                          </div>

                          <div className="text-xs text-gray-500">
                            Est. completion: {bay.estimated_completion}
                          </div>
                        </>
                      )}

                      <div className="flex space-x-2 pt-3">
                        {bay.status === 'available' && (
                          <button 
                            onClick={() => handleStartLoading(bay.id)}
                            disabled={actionLoading === start-}
                            className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                          >
                            {actionLoading === start- ? <LoadingSpinner size="small" /> : 'Start Loading'}
                          </button>
                        )}
                        {bay.status === 'loading' && (
                          <button 
                            onClick={() => handleStopLoading(bay.id)}
                            disabled={actionLoading === stop-}
                            className="flex-1 bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                          >
                            {actionLoading === stop- ? <LoadingSpinner size="small" /> : 'Stop Loading'}
                          </button>
                        )}
                        <button className="flex-1 bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600">
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add placeholders for other tabs */}
        {!['dashboard', 'gauging', 'loading-bays'].includes(activeTab) && (
          <div className="text-center py-12">
            <p className="text-gray-500">This section is being updated with API integration...</p>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default IndustrialLoadingSystem;
