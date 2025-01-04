import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from 'lucide-react';

interface AIGeneratorProps {
  onGenerate: (assignment: { title: string; description: string }) => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // This is a mock API call. Replace with your actual AI generation API.
      const response = await fetch('/api/generate-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      onGenerate(data);
    } catch (error) {
      console.error('Failed to generate assignment:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a prompt for AI generation"
      />
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt}
        className='bg-blue-600 hover:bg-blue-700'
      >
        <Sparkles className="h-4 w-4" />
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate'
        )}
      </Button>
    </div>
  );
};

