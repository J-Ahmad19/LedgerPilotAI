import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, Database, Building, List, X, Play, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

type SourceType = 'PAYMENTS' | 'BANK' | 'SETTLEMENTS' | 'LEDGER';

interface ImportSummary {
  sourceId: string;
  name: string;
  type: SourceType;
  total: number;
  processed: number;
  errors: number;
  duplicates: number;
}

export function Import() {
  const navigate = useNavigate();
  const { updateSession } = useAuth();
  
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [summaries, setSummaries] = useState<ImportSummary[]>([]);

  const handleDemoData = async () => {
    setIsUploading(true);
    const loadingToast = toast.loading("Loading demo dataset...");
    try {
      const data = await api.importDemoData();
      if (data.success) {
        setSummaries(prev => [...prev, ...data.results]);
        const me = await api.getMe();
        const currentToken = localStorage.getItem('token');
        if (currentToken && me.user) {
          updateSession(currentToken, me.user);
        }
        toast.success("Demo dataset loaded successfully!", { id: loadingToast });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while loading demo data.", { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType) return;

    setIsUploading(true);
    const loadingToast = toast.loading(`Uploading ${selectedType} data...`);

    try {
      const data = await api.uploadFile(file, selectedType);
      
      if (data.success) {
        setSummaries(prev => [...prev, {
          sourceId: data.dataSourceId,
          name: file.name,
          type: selectedType,
          ...data.result
        }]);
        setSelectedType(null);
        const me = await api.getMe();
        const currentToken = localStorage.getItem('token');
        if (currentToken && me.user) {
          updateSession(currentToken, me.user);
        }
        toast.success(`${selectedType} data uploaded successfully!`, { id: loadingToast });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred during upload.", { id: loadingToast });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleStartReconciliation = async () => {
    const loadingToast = toast.loading("Starting reconciliation run...");
    try {
      const data = await api.startRun();
      if (data.success && data.runId) {
        toast.success("Reconciliation started successfully!", { id: loadingToast });
        navigate(`/runs/${data.runId}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error starting reconciliation run.", { id: loadingToast });
    }
  };

  if (summaries.length > 0 && !selectedType) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charm-heading tracking-tight">We Found {summaries.length} Data Sources</h1>
            <p className="text-charm-muted mt-1">Review the imported records before starting reconciliation.</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setSelectedType('PAYMENTS')}>
              + Add Another Source
            </Button>
            <Button onClick={handleStartReconciliation} className="flex items-center">
              <Play className="w-4 h-4 mr-2" />
              Start Reconciliation
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {summaries.map((summary, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-charm-brand/10 rounded-full flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-charm-brand" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-charm-heading flex items-center space-x-2">
                      <span>{summary.name}</span>
                      <Badge variant={summary.errors === 0 ? "success" : "warning"}>
                        {summary.type}
                      </Badge>
                    </h3>
                    <p className="text-sm text-charm-muted mt-1">
                      {summary.total} Total Records
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-8 text-sm">
                  <div className="flex flex-col items-center">
                    <span className="text-charm-muted">Processed</span>
                    <span className="font-medium text-green-600 flex items-center mt-1">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {summary.processed}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-charm-muted">Duplicates (Ignored)</span>
                    <span className="font-medium text-gray-600 flex items-center mt-1">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {summary.duplicates}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-charm-muted">Errors</span>
                    <span className={`font-medium flex items-center mt-1 ${summary.errors > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {summary.errors > 0 ? <AlertTriangle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                      {summary.errors}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charm-heading tracking-tight">Connect Your Financial Records</h1>
          <p className="text-charm-muted mt-1">Upload the data you want LedgerPilotAI to reconcile.</p>
        </div>
        <Button variant="outline" onClick={handleDemoData} disabled={isUploading}>
          {isUploading ? "Loading..." : "Try Demo Dataset"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'PAYMENTS', label: 'Payments', icon: Database },
          { id: 'BANK', label: 'Bank', icon: Building },
          { id: 'SETTLEMENTS', label: 'Settlements', icon: RefreshCw },
          { id: 'LEDGER', label: 'Ledger', icon: List }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id as SourceType)}
            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center text-center space-y-3 ${
              selectedType === type.id 
                ? 'border-charm-brand bg-charm-brand/5 shadow-md' 
                : 'border-charm-border bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className={`p-3 rounded-full ${selectedType === type.id ? 'bg-charm-brand/10' : 'bg-gray-100'}`}>
              <type.icon className={`w-6 h-6 ${selectedType === type.id ? 'text-charm-brand' : 'text-gray-500'}`} />
            </div>
            <span className={`font-medium ${selectedType === type.id ? 'text-charm-brand' : 'text-charm-heading'}`}>
              {type.label}
            </span>
          </button>
        ))}
      </div>

      {selectedType && (
        <Card className="p-12 border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <input 
            type="file" 
            accept=".csv,.json" 
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-charm-brand" />
          </div>
          <h3 className="text-lg font-medium text-charm-heading">
            {isUploading ? "Uploading..." : `Upload ${selectedType} Data`}
          </h3>
          <p className="text-charm-muted mt-2 max-w-sm">
            Drag and drop your CSV or JSON file here, or click to browse.
          </p>
        </Card>
      )}
    </div>
  );
}
