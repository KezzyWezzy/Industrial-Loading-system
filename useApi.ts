// src/hooks/useApi.ts
import { useState, useEffect, useCallback } from 'react';
import { ApiService, Tank, Transaction, LoadingBay, GaugingRecord } from '../services/api';

const api = new ApiService(process.env.REACT_APP_API_URL || 'http://localhost:8000');

// Generic data fetching hook
export function useData(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!endpoint) {
        setData(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await api.request(endpoint);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Tank operations hooks
export function useTanks() {
  const { data, loading, error } = useData('/api/tanks');
  
  const createTank = async (tankData) => {
    return await api.request('/api/tanks', {
      method: 'POST',
      body: JSON.stringify(tankData)
    });
  };

  const updateTank = async (tankId, tankData) => {
    return await api.request(/api/tanks/, {
      method: 'PUT',
      body: JSON.stringify(tankData)
    });
  };

  const refetch = useCallback(async () => {
    // Trigger a re-fetch by updating state
    window.location.reload(); // Simple solution for now
  }, []);

  return {
    tanks: data || [],
    loading,
    error,
    refetch,
    tanksLoading: loading,
    tanksError: error,
    createTank,
    updateTank
  };
}

// Gauging operations
export function useGauging() {
  const createGauging = async (gaugingData) => {
    return await api.request('/api/gauging', {
      method: 'POST',
      body: JSON.stringify(gaugingData)
    });
  };

  const getGaugingHistory = async (tankId) => {
    return await api.request(/api/tanks//gauging-history);
  };

  return {
    createGauging,
    getGaugingHistory
  };
}

// Strapping table operations
export function useStrappingTable(tankId) {
  const { data, loading, error } = useData(tankId ? /api/tanks//strapping-table : null);

  const updateTable = async (data) => {
    if (!tankId) throw new Error('No tank selected');
    return await api.request(/api/tanks//strapping-table, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  };

  const calculateVolume = async (level) => {
    // Dummy calculation, replace with API call if needed
    return { volume: level * 100, utilization: (level / 32) * 100 };
  };

  return {
    strappingData: data || [],
    loading,
    error,
    updateTable,
    calculateVolume
  };
}

// Transaction operations
export function useTransactions() {
  const { data, loading, error } = useData('/api/transactions');

  const createTransaction = async (transactionData) => {
    return await api.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  };

  const updateTransaction = async (transactionId, updates) => {
    return await api.request(/api/transactions/, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  };

  return {
    transactions: data || [],
    loading,
    error,
    transactionsLoading: loading,
    transactionsError: error,
    createTransaction,
    updateTransaction
  };
}

// Loading Bay operations
export function useLoadingBays() {
  const { data, loading, error } = useData('/api/loading-bays');

  const updateBay = async (bayId, updates) => {
    return await api.request(/api/loading-bays/, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  };

  const startLoading = async (bayId, transactionId) => {
    return await api.request(/api/loading-bays//start-loading, {
      method: 'POST',
      body: JSON.stringify({ transactionId })
    });
  };

  const stopLoading = async (bayId) => {
    return await api.request(/api/loading-bays//stop-loading, {
      method: 'POST'
    });
  };

  const refetch = useCallback(async () => {
    window.location.reload();
  }, []);

  return {
    bays: data || [],
    loading,
    error,
    refetch,
    updateBay,
    startLoading,
    stopLoading
  };
}

// Gauging Records
export function useGaugingRecords(tankId) {
  const { data, loading, error } = useData(tankId ? /api/tanks//gauging-history : null);

  const createRecord = async (record) => {
    return await api.request('/api/gauging-records', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  };

  const refetch = useCallback(async () => {
    window.location.reload();
  }, []);

  return {
    records: data || [],
    loading,
    error,
    createRecord,
    refetch
  };
}

// Customers
export function useCustomers() {
  const { data, loading, error } = useData('/api/customers');

  return {
    customers: data || [],
    loading,
    error
  };
}

// Products
export function useProducts() {
  const { data, loading, error } = useData('/api/products');

  return {
    products: data || [],
    loading,
    error
  };
}

// Hardware monitoring
export function useHardware() {
  const { data: plcData, loading: plcLoading } = useRealTimeData('/api/hardware/plc-status', 5000);
  const { data: healthData, loading: healthLoading } = useRealTimeData('/api/hardware/system-health', 10000);

  return {
    plcStatus: plcData,
    systemHealth: healthData,
    loading: plcLoading || healthLoading
  };
}

// Reports
export function useReports() {
  const [loading, setLoading] = useState(false);

  const generateReport = async (reportType, params) => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams(params).toString();
      return await api.request(/api/reports/?);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportType, params, format = 'pdf') => {
    setLoading(true);
    try {
      const queryString = new URLSearchParams({ ...params, format }).toString();
      const response = await fetch(${api.baseUrl}/api/reports//download?, {
        headers: api.token ? { Authorization: Bearer  } : {}
      });
      
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ${reportType}_.;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const generateGaugeReport = async (params) => {
    return generateReport('gauge', params);
  };

  const generateReconciliationReport = async (params) => {
    return generateReport('reconciliation', params);
  };

  return {
    generateReport,
    downloadReport,
    generateGaugeReport,
    generateReconciliationReport,
    loading
  };
}

// File operations
export function useFileOperations() {
  const [loading, setLoading] = useState(false);

  const uploadFile = async (file, endpoint) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(${api.baseUrl}, {
        method: 'POST',
        body: formData,
        headers: api.token ? { Authorization: Bearer  } : {}
      });

      if (!response.ok) throw new Error('File upload failed');
      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (endpoint, filename) => {
    setLoading(true);
    try {
      const response = await fetch(${api.baseUrl}, {
        headers: api.token ? { Authorization: Bearer  } : {}
      });

      if (!response.ok) throw new Error('File download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (data, filename) => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const importCsv = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          const data = parseCSV(text);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  return {
    uploadFile,
    downloadFile,
    exportData,
    importCsv,
    loading
  };
}

// Helper functions for CSV operations
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const value = obj[header];
      return typeof value === 'string' && value.includes(',') 
        ? "" 
        : value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    return obj;
  });
}

// Real-time data hook
export function useRealTimeData(endpoint, interval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.request(endpoint);
        setData(response);
        setError(null);
      } catch (err) {
       setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [endpoint, interval]);

  return { data, loading, error };
}
