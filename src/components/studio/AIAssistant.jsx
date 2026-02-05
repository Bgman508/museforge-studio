import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Lightbulb, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  {
    title: "Add Variation",
    description: "Create a breakdown section with different energy",
    instruction: "Create a breakdown section with stripped-back elements and different energy"
  },
  {
    title: "Layer Harmonies",
    description: "Add harmony layers to the melody",
    instruction: "Add harmony layers and chord inversions to enrich the melodic content"
  },
  {
    title: "Groove Enhancement",
    description: "Add swing and groove to the drums",
    instruction: "Add swing timing and groove variations to the drum pattern"
  },
  {
    title: "Build Tension",
    description: "Create a rising tension before the drop",
    instruction: "Add risers, drum fills, and melodic tension building into a climactic moment"
  },
  {
    title: "Soften Dynamics",
    description: "Reduce velocity for smoother feel",
    instruction: "Reduce note velocities and add softer dynamics for a more intimate vibe"
  },
  {
    title: "Add Counterpoint",
    description: "Create melodic call and response",
    instruction: "Add a counterpoint melody that creates call-and-response with the main melody"
  }
];

export default function AIAssistant({ onClose, onSuggest, currentProject }) {
  const [generating, setGenerating] = useState(false);

  const handleSuggest = async (instruction) => {
    setGenerating(true);
    await onSuggest(instruction);
    setGenerating(false);
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 bg-[#141416] border-l border-[#252529] flex flex-col"
    >
      <div className="h-14 bg-[#1C1C1F] border-b border-[#252529] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#00D9FF]" />
          <h3 className="font-semibold text-white">AI Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-[#A1A1AA] hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentProject ? (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-[#A1A1AA] mx-auto mb-3" />
            <p className="text-sm text-[#A1A1AA]">
              Generate a composition first to get AI suggestions
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-[#00D9FF]/10 to-[#FFB800]/10 rounded-lg p-4 border border-[#252529]">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#00D9FF] mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Creative Suggestions</h4>
                  <p className="text-xs text-[#A1A1AA]">
                    Click any suggestion to enhance your composition
                  </p>
                </div>
              </div>
            </div>

            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggest(suggestion.instruction)}
                disabled={generating}
                className="w-full bg-[#1C1C1F] hover:bg-[#252529] border border-[#252529] rounded-lg p-4 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <Wand2 className="w-4 h-4 text-[#FFB800] mt-0.5 group-hover:text-[#00D9FF] transition-colors" />
                  <div>
                    <div className="text-sm font-medium text-white mb-1">
                      {suggestion.title}
                    </div>
                    <div className="text-xs text-[#A1A1AA]">
                      {suggestion.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      <div className="p-4 border-t border-[#252529]">
        <div className="text-xs text-[#71717A] space-y-2">
          <p>💡 AI suggestions are context-aware</p>
          <p>✨ Each suggestion maintains your style</p>
          <p>🎵 Results are instant and editable</p>
        </div>
      </div>
    </motion.div>
  );
}