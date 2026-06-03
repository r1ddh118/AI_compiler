import { useState, useEffect } from 'react';
import PromptInput from './components/PromptInput';
import PipelineVisualizer from './components/PipelineVisualizer';
import MetricsDashboard from './components/MetricsDashboard';
import SchemaViewer from './components/SchemaViewer';

interface PipelineStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

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

interface Metrics {
  totalEntities: number;
  totalEndpoints: number;
  totalPages: number;
  processingTime: number;
}

export default function App() {
  const [stages, setStages] = useState<PipelineStage[]>([
    { name: 'Intent Extraction', status: 'pending' },
    { name: 'Architecture Design', status: 'pending' },
    { name: 'Schema Generation', status: 'pending' },
    { name: 'Validation', status: 'pending' },
    { name: 'Runtime Config', status: 'pending' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<CompilerOutput | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const simulatePipeline = async (prompt: string) => {
    setIsProcessing(true);
    setOutput(null);
    setMetrics(null);

    const stageTimings = [1200, 1800, 2200, 1000, 1500];
    const newStages = [...stages];

    for (let i = 0; i < newStages.length; i++) {
      newStages[i] = { ...newStages[i], status: 'processing' };
      setStages([...newStages]);

      await new Promise(resolve => setTimeout(resolve, stageTimings[i]));

      newStages[i] = {
        ...newStages[i],
        status: 'completed',
        duration: stageTimings[i]
      };
      setStages([...newStages]);
    }

    // Simulate compiled output
    const mockOutput: CompilerOutput = {
      appName: prompt.split(' ').slice(0, 3).join(' '),
      entities: ['User', 'Project', 'Task', 'Comment'],
      roles: ['Admin', 'User', 'Guest'],
      assumptions: [
        'PostgreSQL database with standard CRUD operations',
        'JWT-based authentication',
        'RESTful API with standard HTTP methods',
        'React-based frontend with responsive design'
      ],
      validationStatus: 'passed',
      dbSchema: {
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'email', type: 'varchar(255)', unique: true },
              { name: 'password_hash', type: 'varchar(255)' },
              { name: 'role', type: 'varchar(50)' },
              { name: 'created_at', type: 'timestamp' }
            ]
          },
          {
            name: 'projects',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'name', type: 'varchar(255)' },
              { name: 'description', type: 'text' },
              { name: 'owner_id', type: 'uuid', foreignKey: 'users.id' },
              { name: 'created_at', type: 'timestamp' }
            ]
          }
        ]
      },
      apiSchema: {
        endpoints: [
          {
            path: '/api/auth/login',
            method: 'POST',
            body: { email: 'string', password: 'string' },
            response: { token: 'string', user: 'User' }
          },
          {
            path: '/api/projects',
            method: 'GET',
            auth: 'required',
            response: { projects: 'Project[]' }
          },
          {
            path: '/api/projects/:id',
            method: 'GET',
            auth: 'required',
            response: { project: 'Project' }
          }
        ]
      },
      uiSchema: {
        pages: [
          {
            path: '/',
            component: 'HomePage',
            layout: 'MainLayout',
            sections: ['Hero', 'Features', 'CTA']
          },
          {
            path: '/dashboard',
            component: 'DashboardPage',
            auth: 'required',
            layout: 'DashboardLayout',
            sections: ['Sidebar', 'ProjectList', 'Stats']
          },
          {
            path: '/projects/:id',
            component: 'ProjectDetailPage',
            auth: 'required',
            layout: 'DashboardLayout',
            sections: ['ProjectHeader', 'TaskList', 'Comments']
          }
        ]
      },
      generatedCode: {
        'server.js': `const express = require('express');
const app = express();

app.use(express.json());

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // Authentication logic here
  res.json({ token: 'jwt-token', user: {} });
});

// Project routes
app.get('/api/projects', async (req, res) => {
  // Fetch projects from database
  res.json({ projects: [] });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});`,
        'schema.sql': `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);`,
        'DashboardPage.tsx': `import React from 'react';

export default function DashboardPage() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/projects">Projects</a>
        </nav>
      </aside>
      <main>
        <h1>Dashboard</h1>
        <div className="project-list">
          {/* Project list component */}
        </div>
      </main>
    </div>
  );
}`
      },
      rawJson: {
        version: '1.0',
        generated_at: new Date().toISOString(),
        prompt: prompt
      }
    };

    setOutput(mockOutput);
    setMetrics({
      totalEntities: mockOutput.entities.length,
      totalEndpoints: mockOutput.apiSchema.endpoints.length,
      totalPages: mockOutput.uiSchema.pages.length,
      processingTime: stageTimings.reduce((a, b) => a + b, 0)
    });

    setIsProcessing(false);
  };

  const handleSubmit = async (prompt: string) => {
    // Reset stages
    setStages(stages.map(s => ({ ...s, status: 'pending', duration: undefined })));

    // Try backend first, fallback to simulation
    try {
      const response = await fetch('http://localhost:3001/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        // Handle real backend response
        setOutput(data.output);
        setMetrics(data.metrics);
      } else {
        throw new Error('Backend error');
      }
    } catch (error) {
      // Fallback to simulation
      console.log('Using simulation mode');
      await simulatePipeline(prompt);
    }
  };

  return (
    <div className="size-full bg-gray-950 text-gray-100 flex">
      {/* Left Panel */}
      <div className="w-96 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-indigo-400">AI App Compiler</h1>
          <p className="text-sm text-gray-500 mt-1">
            Natural Language → Executable App Spec
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <PromptInput onSubmit={handleSubmit} isProcessing={isProcessing} />
          <PipelineVisualizer stages={stages} />
          <MetricsDashboard metrics={metrics} />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 px-6 py-4 bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-200">Output Viewer</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <SchemaViewer output={output} />
        </div>
      </div>
    </div>
  );
}
