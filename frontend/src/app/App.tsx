import { useMemo, useState } from 'react';
import PromptInput from './components/PromptInput';
import PipelineVisualizer from './components/PipelineVisualizer';
import MetricsDashboard from './components/MetricsDashboard';
import SchemaViewer from './components/SchemaViewer';

interface PipelineStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

interface CompilerResponse {
  success?: boolean;
  stage?: string;
  appConfig?: {
    app_name?: string;
    db?: { tables?: unknown[] };
    api?: { endpoints?: unknown[] };
    ui?: { pages?: unknown[] };
    validation?: {
      passed?: boolean;
      issues?: unknown[];
      warnings?: unknown[];
      report?: unknown;
    };
    runtime?: {
      express_routes_code?: string;
      drizzle_schema_code?: string;
      generated_files?: string[];
      instructions?: string[];
    };
    metadata?: unknown;
    intent?: unknown;
    architecture?: unknown;
    auth?: unknown;
  };
  validation?: {
    passed?: boolean;
    issues?: unknown[];
    warnings?: unknown[];
    report?: unknown;
  };
  runtime?: {
    express_routes_code?: string;
    drizzle_schema_code?: string;
    generated_files?: string[];
    instructions?: string[];
  };
  retryCount?: number;
  error?: string;
}

interface Metrics {
  tablesGenerated: number;
  endpointsGenerated: number;
  pagesGenerated: number;
  latencyMs: number;
  retryCount: number;
  validationIssuesCount: number;
}

const initialStages: PipelineStage[] = [
  { name: 'Intent Extraction', status: 'pending' },
  { name: 'Architecture Design', status: 'pending' },
  { name: 'Schema Generation', status: 'pending' },
  { name: 'Validation + Repair', status: 'pending' },
  { name: 'Runtime Simulation', status: 'pending' },
];

export default function App() {
  const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '';
  const apiBaseUrl =
    !rawApiBaseUrl ||
    rawApiBaseUrl.includes('localhost:3001') ||
    rawApiBaseUrl.includes('127.0.0.1:3001')
      ? ''
      : rawApiBaseUrl.replace(/\/$/, '');
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<CompilerResponse['appConfig'] | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  const stageLabels = useMemo(() => initialStages.map((stage) => stage.name), []);

  const updateStage = (index: number, status: PipelineStage['status'], duration?: number) => {
    setStages((current) =>
      current.map((stage, currentIndex) =>
        currentIndex === index ? { ...stage, status, duration } : stage
      )
    );
  };

  const handleSubmit = async (prompt: string) => {
    setError('');
    setOutput(null);
    setMetrics(null);
    setIsProcessing(true);
    setStages(initialStages.map((stage) => ({ ...stage, status: 'pending', duration: undefined })));

    const startedAt = performance.now();

    try {
      for (let index = 0; index < stageLabels.length; index += 1) {
        updateStage(index, 'processing');
      }

      const response = await fetch(`${apiBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const responseText = await response.text();
      const data = responseText ? (JSON.parse(responseText) as CompilerResponse) : null;

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || responseText || 'Compilation failed');
      }

      const latencyMs = Math.round(performance.now() - startedAt);
      setStages((current) =>
        current.map((stage) => ({ ...stage, status: 'completed', duration: Math.round(latencyMs / current.length) }))
      );

      setOutput(data.appConfig || null);
      setMetrics({
        tablesGenerated: data.appConfig?.db?.tables?.length || 0,
        endpointsGenerated: data.appConfig?.api?.endpoints?.length || 0,
        pagesGenerated: data.appConfig?.ui?.pages?.length || 0,
        latencyMs,
        retryCount: data.retryCount || 0,
        validationIssuesCount: data.validation?.issues?.length || 0,
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Something went wrong');
      setStages((current) =>
        current.map((stage, index) =>
          index === current.length - 1 ? { ...stage, status: 'error' } : stage
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-950 text-gray-100">
      <aside className="flex w-96 flex-col border-r border-gray-800">
        <div className="border-b border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-indigo-400">AI App Compiler</h1>
          <p className="mt-1 text-sm text-gray-500">Natural Language → Executable App Spec</p>
        </div>

        <div className="flex-1 space-y-6 overflow-auto p-6">
          <PromptInput onSubmit={handleSubmit} isProcessing={isProcessing} />
          <PipelineVisualizer stages={stages} />
          <MetricsDashboard metrics={metrics} />
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <SchemaViewer output={output} />
      </main>
    </div>
  );
}
