import { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
}

const examplePrompts = [
  'Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments.',
  'Create an e-commerce platform with products, cart, checkout, orders, and admin inventory management.',
  'Build a SaaS invoicing app with clients, invoices, line items, payment tracking, and PDF generation.',
  'Create a booking platform for appointments with providers, availability calendar, and reminders.',
];

export default function PromptInput({ onSubmit, isProcessing }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim() && !isProcessing) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">App Description</label>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe your app in natural language..."
          className="h-32 w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isProcessing}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isProcessing}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-700"
      >
        {isProcessing ? 'Processing...' : 'Compile App'}
      </button>

      <div className="mt-2">
        <h3 className="mb-3 text-sm font-medium text-gray-400">Example Prompts</h3>
        <div className="space-y-2">
          {examplePrompts.map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              disabled={isProcessing}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
