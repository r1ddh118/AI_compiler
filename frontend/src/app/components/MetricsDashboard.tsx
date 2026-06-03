interface Metrics {
  tablesGenerated: number;
  endpointsGenerated: number;
  pagesGenerated: number;
  latencyMs: number;
  retryCount: number;
  validationIssuesCount: number;
}

interface MetricsDashboardProps {
  metrics: Metrics | null;
}

export default function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  if (!metrics) return null;

  const cards = [
    { label: 'Tables', value: metrics.tablesGenerated },
    { label: 'Endpoints', value: metrics.endpointsGenerated },
    { label: 'Pages', value: metrics.pagesGenerated },
    { label: 'Latency (ms)', value: metrics.latencyMs },
    { label: 'Retries', value: metrics.retryCount },
    { label: 'Validation Issues', value: metrics.validationIssuesCount },
  ];

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-300">Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-800 bg-gray-950 p-3">
            <div className="text-2xl font-bold text-indigo-400">{card.value}</div>
            <div className="mt-1 text-xs text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
