interface PipelineStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

interface PipelineVisualizerProps {
  stages: PipelineStage[];
}

const statusClasses: Record<PipelineStage['status'], string> = {
  pending: 'border-gray-700 bg-gray-950 text-gray-500',
  processing: 'border-indigo-500 bg-indigo-500/10 text-indigo-400',
  completed: 'border-green-500 bg-green-500/10 text-green-400',
  error: 'border-red-500 bg-red-500/10 text-red-400',
};

export default function PipelineVisualizer({ stages }: PipelineVisualizerProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-300">Pipeline Stages</h3>
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.name} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${statusClasses[stage.status]}`}>
              {stage.status === 'completed' && <span className="text-xs">✓</span>}
              {stage.status === 'processing' && <span className="animate-pulse text-xs">⏳</span>}
              {stage.status === 'error' && <span className="text-xs">×</span>}
              {stage.status === 'pending' && <span className="h-2 w-2 rounded-full bg-gray-600" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-200">{stage.name}</span>
                {typeof stage.duration === 'number' && (
                  <span className="text-xs text-gray-500">{stage.duration}ms</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
