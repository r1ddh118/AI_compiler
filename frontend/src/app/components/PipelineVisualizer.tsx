interface PipelineStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

interface PipelineVisualizerProps {
  stages: PipelineStage[];
}

export default function PipelineVisualizer({ stages }: PipelineVisualizerProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Pipeline Stages</h3>
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 bg-gray-950
              ${stage.status === 'completed' ? 'border-green-500 bg-green-500/10' : ''}
              ${stage.status === 'processing' ? 'border-indigo-500 bg-indigo-500/10 animate-pulse' : ''}
              ${stage.status === 'error' ? 'border-red-500 bg-red-500/10' : ''}
              ${stage.status === 'pending' ? 'border-gray-700' : ''}"
            >
              {stage.status === 'completed' && (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {stage.status === 'processing' && (
                <svg className="w-4 h-4 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {stage.status === 'error' && (
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {stage.status === 'pending' && (
                <span className="w-2 h-2 rounded-full bg-gray-600"></span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium
                  ${stage.status === 'completed' ? 'text-green-400' : ''}
                  ${stage.status === 'processing' ? 'text-indigo-400' : ''}
                  ${stage.status === 'error' ? 'text-red-400' : ''}
                  ${stage.status === 'pending' ? 'text-gray-500' : ''}`}
                >
                  {stage.name}
                </span>
                {stage.duration && (
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
