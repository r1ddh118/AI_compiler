import { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
}

const examplePrompts = [
  "Build a task management app with user authentication, projects, and tasks with priorities",
  "Create a blog platform with posts, comments, tags, and user profiles",
  "Design an e-commerce store with products, cart, orders, and payment processing",
  "Build a social media feed with posts, likes, comments, and following system"
];

export default function PromptInput({ onSubmit, isProcessing }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim() && !isProcessing) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          App Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your app in natural language..."
          className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          disabled={isProcessing}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isProcessing}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {isProcessing ? 'Processing...' : 'Compile App'}
      </button>

      <div className="mt-2">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Example Prompts</h3>
        <div className="space-y-2">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              disabled={isProcessing}
              className="w-full text-left text-sm text-gray-400 hover:text-indigo-400 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
