interface Metrics {
  totalEntities: number;
  totalEndpoints: number;
  totalPages: number;
  processingTime: number;
}

interface MetricsDashboardProps {
  metrics: Metrics | null;
}

export default function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  if (!metrics) return null;

  const metricCards = [
    { label: 'Entities', value: metrics.totalEntities, color: 'indigo' },
    { label: 'API Endpoints', value: metrics.totalEndpoints, color: 'blue' },
    { label: 'UI Pages', value: metrics.totalPages, color: 'purple' },
    { label: 'Time (ms)', value: metrics.processingTime, color: 'green' },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((metric, index) => (
          <div key={index} className="bg-gray-950 border border-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-${metric.color}-400">
              {metric.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
