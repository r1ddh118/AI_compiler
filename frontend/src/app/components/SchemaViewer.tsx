import { useState } from 'react';

interface CompilerOutput {
  appName: string;
  entities: string[];
  roles: string[];
  assumptions: string[];
  validationStatus: string;
  dbSchema: any;
  apiSchema: any;
  uiSchema: any;
  generatedCode: { [filename: string]: string };
  rawJson: any;
}

interface SchemaViewerProps {
  output: CompilerOutput | null;
}

export default function SchemaViewer({ output }: SchemaViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCodeFile, setActiveCodeFile] = useState<string>('');

  if (!output) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No output yet. Submit a prompt to begin compilation.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'dbSchema', label: 'DB Schema' },
    { id: 'apiSchema', label: 'API Schema' },
    { id: 'uiSchema', label: 'UI Schema' },
    { id: 'generatedCode', label: 'Generated Code' },
    { id: 'rawJson', label: 'Raw JSON' },
  ];

  const codeFiles = output.generatedCode ? Object.keys(output.generatedCode) : [];
  if (codeFiles.length > 0 && !activeCodeFile) {
    setActiveCodeFile(codeFiles[0]);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-800 flex gap-1 px-2 bg-gray-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-950">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">App Name</h3>
              <p className="text-gray-400">{output.appName}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Entities Detected</h3>
              <div className="flex flex-wrap gap-2">
                {output.entities.map((entity, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm border border-indigo-500/30">
                    {entity}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Roles</h3>
              <div className="flex flex-wrap gap-2">
                {output.roles.map((role, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Assumptions Made</h3>
              <ul className="space-y-2">
                {output.assumptions.map((assumption, i) => (
                  <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                    <span className="text-gray-600 mt-1">•</span>
                    <span>{assumption}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Validation Status</h3>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                output.validationStatus === 'passed'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {output.validationStatus === 'passed' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-medium">{output.validationStatus}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dbSchema' && (
          <pre className="text-sm text-gray-300 font-mono bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-auto">
            {JSON.stringify(output.dbSchema, null, 2)}
          </pre>
        )}

        {activeTab === 'apiSchema' && (
          <pre className="text-sm text-gray-300 font-mono bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-auto">
            {JSON.stringify(output.apiSchema, null, 2)}
          </pre>
        )}

        {activeTab === 'uiSchema' && (
          <pre className="text-sm text-gray-300 font-mono bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-auto">
            {JSON.stringify(output.uiSchema, null, 2)}
          </pre>
        )}

        {activeTab === 'generatedCode' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {codeFiles.map((filename) => (
                <button
                  key={filename}
                  onClick={() => setActiveCodeFile(filename)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeCodeFile === filename
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {filename}
                </button>
              ))}
            </div>
            {activeCodeFile && (
              <pre className="text-sm text-gray-300 font-mono bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-auto">
                {output.generatedCode[activeCodeFile]}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'rawJson' && (
          <pre className="text-sm text-gray-300 font-mono bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-auto">
            {JSON.stringify(output.rawJson, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
