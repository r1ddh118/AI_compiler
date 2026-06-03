import { useMemo, useState } from 'react';

interface SchemaViewerProps {
  output: {
    app_name?: string;
    intent?: unknown;
    architecture?: unknown;
    db?: unknown;
    api?: unknown;
    ui?: unknown;
    auth?: unknown;
    validation?: unknown;
    runtime?: {
      express_routes_code?: string;
      drizzle_schema_code?: string;
      generated_files?: string[];
      instructions?: string[];
    };
    metadata?: unknown;
  } | null;
}

export default function SchemaViewer({ output }: SchemaViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'db', label: 'DB Schema' },
      { id: 'api', label: 'API Schema' },
      { id: 'ui', label: 'UI Schema' },
      { id: 'runtime', label: 'Runtime' },
      { id: 'raw', label: 'Raw JSON' },
    ],
    []
  );

  if (!output) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-sm">No output yet. Submit a prompt to begin compilation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-gray-800 bg-gray-900 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto bg-gray-950 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-200">App Name</h3>
              <p className="text-gray-400">{output.app_name}</p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-200">Validation</h3>
              <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
                {JSON.stringify(output.validation, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'db' && (
          <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
            {JSON.stringify(output.db, null, 2)}
          </pre>
        )}

        {activeTab === 'api' && (
          <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
            {JSON.stringify(output.api, null, 2)}
          </pre>
        )}

        {activeTab === 'ui' && (
          <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
            {JSON.stringify(output.ui, null, 2)}
          </pre>
        )}

        {activeTab === 'runtime' && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-300">Express Routes</h3>
              <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
                {output.runtime?.express_routes_code || ''}
              </pre>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-300">Drizzle Schema</h3>
              <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
                {output.runtime?.drizzle_schema_code || ''}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <pre className="overflow-auto rounded-lg border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
            {JSON.stringify(output, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
