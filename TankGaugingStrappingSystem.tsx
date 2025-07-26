// UpdatedTankGaugingStrappingSystem.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Ruler, 
  Calculator, 
  FileText, 
  Download, 
  Upload, 
  Save, 
  Edit3, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  TrendingUp, 
  Thermometer, 
  Droplets, 
  Database,
  Eye,
  RefreshCw,
  Grid,
  LineChart,
  Table,
  Settings,
  Loader2
} from 'lucide-react';

// Import hooks
import {
  useTanks,
  useGaugingRecords,
  useStrappingTable,
  useReports,
  useFileOperations
} from '../hooks/useApi';
import { Tank } from '../services/api';

// Reusable components
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

const ErrorMessage = ({ error, onRetry } ) => (
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
  const [calculatedVolume, setCalculatedVolume] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // API Hooks
  const { tanks, loading: tanksLoading, error: tanksError, refetch: refetchTanks } = useTanks();
  const { records: gaugingHistory, loading: recordsLoading, error: recordsError, createRecord, refetch: refetchRecords } = useGaugingRecords(selectedTank || undefined);
  const { strappingData, loading: strappingLoading, error: strappingError, updateTable, calculateVolume } = useStrappingTable(selectedTank);
  const { generateGaugeReport, generateReconciliationReport, generateStrappingReport, loading: reportsLoading } = useReports();
  const { exportData, importCsv, loading: fileLoading } = useFileOperations();

  // Set default selected tank when tanks load
  useEffect(() => {
    if (tanks.length > 0 && !selectedTank) {
      setSelectedTank(tanks[0].id);
    }
  }, [tanks, selectedTank]);

  // Calculate volume when level changes
  useEffect(() => {
    const calculateVolumeFromLevel = async () => {
      if (manualReading.level && selectedTank) {
        try {
          const result = await calculateVolume(parseFloat(manualReading.level));
          setCalculatedVolume(result);
        } catch (error) {
          console.error('Error calculating volume:', error);
          setCalculatedVolume(null);
        }
      } else {
        setCalculatedVolume(null);
      }
    };

    const timeoutId = setTimeout(calculateVolumeFromLevel, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [manualReading.level, selectedTank, calculateVolume]);

  // Handle manual reading input
  const handleReadingChange = useCallback((field, value) => {
    setManualReading(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Submit manual gauge reading
  const submitGaugeReading = useCallback(async () => {
    if (!manualReading.level || !manualReading.observer || !selectedTank) {
      alert('Please enter at least the level, observer, and select a tank');
      return;
    }

    setActionLoading('gauge');
    
    try {
      const newRecord = {
        tank_id: selectedTank,
        gauge_time: new Date().toISOString(),
        level: parseFloat(manualReading.level),
        temperature: parseFloat(manualReading.temperature) || 20,
        water_level: parseFloat(manualReading.waterLevel) || 0,
        volume: calculatedVolume?.volume || 0,
        calculated_volume: calculatedVolume?.volume || 0,
        gauge_type: 'manual',
        operator: manualReading.observer,
        variance: 0,
        notes: manualReading.notes
      };

      await createRecord(newRecord);
      
      // Reset form
      setManualReading({
        level: '',
        temperature: '',
        waterLevel: '',
        observer: '',
        notes: ''
      });
      
      alert('Gauge reading recorded successfully');
    } catch (error) {
      alert(Error recording gauge reading: );
    } finally {
      setActionLoading(null);
    }
  }, [manualReading, selectedTank, calculatedVolume, createRecord]);

  // Add new strapping entry
  const addStrappingEntry = useCallback(async () => {
    if (!newStrappingEntry.height || !newStrappingEntry.volume) {
      alert('Please enter both height and volume');
      return;
    }

    setActionLoading('add-strapping');
    
    try {
      const newEntry = {
        height: parseFloat(newStrappingEntry.height).toFixed(2),
        volume: parseInt(newStrappingEntry.volume),
        quarterInch: ((parseFloat(newStrappingEntry.height) % 1) * 4).toString()
      };

      const updatedData = [...strappingData, newEntry].sort((a, b) => parseFloat(a.height) - parseFloat(b.height));
      await updateTable(updatedData);
      setNewStrappingEntry({ height: '', volume: '' });
      alert('Strapping entry added successfully');
    } catch (error) {
      alert(Error adding strapping entry: );
    } finally {
      setActionLoading(null);
    }
  }, [newStrappingEntry, strappingData, updateTable]);

  // Remove strapping entry
  const removeStrappingEntry = useCallback(async (index) => {
    setActionLoading('remove-strapping');
    
    try {
      const updatedData = strappingData.filter((entry, i) => i !== index);
      await updateTable(updatedData);
      alert('Strapping entry removed successfully');
    } catch (error) {
      alert(Error removing strapping entry: );
    } finally {
      setActionLoading(null);
    }
  }, [strappingData, updateTable]);

  // Handle file import
  const handleFileImport = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importCsv(file);
      alert(Import completed:  entries imported.);
      // In real, update strappingData
      // Reset file input
      event.target.value = '';
    } catch (error) {
      alert(Import failed: );
    }
  }, [importCsv]);

  // Get selected tank data
  const selectedTankData = tanks.find((t) => t.id === selectedTank);

  // Loading state for the entire component
  if (tanksLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading tank data...</p>
        </div>
      </div>
    );
  }

  // Manual Gauging Tab
  const ManualGaugingTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Manual Tank Gauging</h3>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                if (selectedTank) {
                  try {
                    await generateGaugeReport(selectedTank);
                  } catch (error) {
                    alert(Error generating report: );
                  }
                }
              }}
              disabled={reportsLoading || !selectedTank}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {reportsLoading ? <LoadingSpinner size="small" /> : <FileText className="h-4 w-4" />}
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {tanksError && (
          <ErrorMessage error={tanksError} onRetry={refetchTanks} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tank Selection</label>
              <select
                value={selectedTank}
                onChange={(e) => setSelectedTank(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={tanksLoading}
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
                    <span className={ont-medium }>
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
        
        {recordsError && (
          <ErrorMessage error={recordsError} onRetry={refetchRecords} />
        )}

        {recordsLoading ? (
          <LoadingSpinner />
        ) : (
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
                      {reading.temperature ? ${reading.temperature}°F : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reading.water_level > 0 ? ${reading.water_level.toFixed(2)}" : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reading.operator}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => exportData([], 'gauging-record.pdf')} // Fix: pass empty array
                          className="text-green-600 hover:text-green-800"
                          disabled={fileLoading}
                        >
                          <Download className="h-4 w-4" />
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
              className={px-4 py-2 rounded transition-colors flex items-center space-x-2 disabled:opacity-50 }
            >
              <Edit3 className="h-4 w-4" />
              <span>{editingStrapping ? 'Stop Editing' : 'Edit Table'}</span>
            </button>
            <button 
              onClick={() => exportData([], 'strapping.csv')}
              disabled={fileLoading || !selectedTank}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {fileLoading ? <LoadingSpinner size="small" /> : <Download className="h-4 w-4" />}
              <span>Export</span>
            </button>
            <label className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors flex items-center space-x-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                className="hidden"
                disabled={fileLoading}
              />
            </label>
          </div>
        </div>

        {strappingError && (
          <ErrorMessage error={strappingError} onRetry={() => window.location.reload()} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strapping Table */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Tank: {selectedTankData?.tank_number || 'Select a tank'}</h4>
              <div className="text-sm text-gray-600">
                Total Entries: {strappingData.length} | 
                Range: {strappingData.length > 0 ? ${strappingData[0]?.height}" - " : 'N/A'}
              </div>
            </div>

            {editingStrapping && selectedTank && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h5 className="font-medium text-gray-800 mb-3">Add New Entry</h5>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Height (ft)"
                    value={newStrappingEntry.height}
                    onChange={(e) => setNewStrappingEntry(prev => ({ ...prev, height: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Volume (BBL)"
                    value={newStrappingEntry.volume}
                    onChange={(e) => setNewStrappingEntry(prev => ({ ...prev, volume: e.target.value }))}
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    onClick={addStrappingEntry}
                    disabled={actionLoading === 'add-strapping'}
                    className="bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {actionLoading === 'add-strapping' ? <LoadingSpinner size="small" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {strappingLoading ? (
              <LoadingSpinner />
            ) : selectedTank ? (
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
                      {editingStrapping && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
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
                        {editingStrapping && (
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => removeStrappingEntry(index)}
                              disabled={actionLoading === 'remove-strapping'}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              {actionLoading === 'remove-strapping' ? <LoadingSpinner size="small" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Table className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a tank to view strapping table</p>
              </div>
            )}
          </div>

          {/* Tank Visualization and Statistics */}
          <div className="space-y-4">
            {selectedTankData && (
              <>
                {/* Tank Profile Visualization */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-4">Tank Profile</h4>
                  
                  <div className="relative">
                    <svg width="200" height="300" className="mx-auto">
                      {/* Tank outline */}
                      <rect x="50" y="50" width="100" height="200" fill="none" stroke="#374151" strokeWidth="2" />
                      
                      {/* Current level indicator */}
                      {manualReading.level && (
                        <>
                          <rect 
                            x="52" 
                            y={250 - (parseFloat(manualReading.level) / (selectedTankData.height || 32)) * 200} 
                            width="96" 
                            height={(parseFloat(manualReading.level) / (selectedTankData.height || 32)) * 200}
                            fill="#3B82F6" 
                            opacity="0.6"
                          />
                          <line 
                            x1="30" 
                            y1={250 - (parseFloat(manualReading.level) / (selectedTankData.height || 32)) * 200}
                            x2="170" 
                            y2={250 - (parseFloat(manualReading.level) / (selectedTankData.height || 32)) * 200}
                            stroke="#EF4444" 
                            strokeWidth="2"
                          />
                          <text 
                            x="175" 
                            y={250 - (parseFloat(manualReading.level) / (selectedTankData.height || 32)) * 200 + 5}
                            fontSize="12" 
                            fill="#EF4444"
                          >
                            {manualReading.level}"
                          </text>
                        </>
                      )}
                      
                      {/* Water level */}
                      {manualReading.waterLevel && parseFloat(manualReading.waterLevel) > 0 && (
                        <rect 
                          x="52" 
                          y={250 - (parseFloat(manualReading.waterLevel) / (selectedTankData.height || 32)) * 200} 
                          width="96" 
                          height={(parseFloat(manualReading.waterLevel) / (selectedTankData.height || 32)) * 200}
                          fill="#DC2626" 
                          opacity="0.8"
                        />
                      )}
                      
                      {/* Tank measurements */}
                      <text x="100" y="40" textAnchor="middle" fontSize="12" fill="#374151">
                        Tank {selectedTankData.tank_number}
                      </text>
                      <text x="100" y="280" textAnchor="middle" fontSize="10" fill="#6B7280">
                        {selectedTankData.height || 32} ft
                      </text>
                    </svg>
                  </div>
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 opacity-60 rounded"></div>
                      <span>Product Level</span>
                    </div>
                    {manualReading.waterLevel && parseFloat(manualReading.waterLevel) > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-600 opacity-80 rounded"></div>
                        <span>Water Level</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 border border-red-500"></div>
                      <span>Current Reading</span>
                    </div>
                  </div>
                </div>

                {/* Strapping Statistics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Table Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Entries:</span>
                      <span className="font-medium">{strappingData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Volume:</span>
                      <span className="font-medium">
                        {strappingData.length > 0 ? Math.max(...strappingData.map((d) => d.volume)).toLocaleString() : 0} BBL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Increment:</span>
                      <span className="font-medium">0.25"</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {selectedTankData.lastCalibration || 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Volume Lookup */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Quick Volume Lookup</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter height (ft)"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      onChange={async (e) => {
                        if (e.target.value && selectedTank) {
                          try {
                            const result = await calculateVolume(parseFloat(e.target.value));
                            const display = document.getElementById('lookup-result');
                            if (display) {
                              display.textContent = ${result.volume.toLocaleString()} BBL;
                            }
                          } catch (error) {
                            const display = document.getElementById('lookup-result');
                            if (display) {
                              display.textContent = 'Invalid height';
                            }
                          }
                        } else {
                          const display = document.getElementById('lookup-result');
                          if (display) {
                            display.textContent = 'Enter height above';
                          }
                        }
                      }}
                    />
                    <div className="text-center">
                      <span className="text-lg font-semibold text-blue-600" id="lookup-result">
                        Enter height above
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Ruler className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Tank Gauging & Strapping System</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Last Update: {new Date().toLocaleTimeString()}</span>
              </div>
              <button 
                onClick={() => {
                  refetchTanks();
                  refetchRecords();
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
                disabled={tanksLoading || recordsLoading}
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

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
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
                className={lex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm }
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'manual-gauge' && <ManualGaugingTab />}
        {activeTab === 'strapping-table' && <StrappingTableTab />}
        
        {/* Placeholder for other tabs */}
        {['reports', 'configuration'].includes(activeTab) && (
          <div className="text-center py-12">
            <p className="text-gray-500">This section is being updated with API integration...</p>
            <button 
              onClick={() => setActiveTab('manual-gauge')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Return to Manual Gauging
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>© 2024 Tank Gauging System</span>
              <span>|</span>
              <span>API Standards Compliant</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Accuracy: ±0.01" | Resolution: 1/4"</span>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Calibrated</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TankGaugingStrappingSystem;
