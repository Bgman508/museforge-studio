import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Wand2, Loader2 } from "lucide-react";

const PRESETS = [
  { value: "trap_soul", label: "Trap Soul", emoji: "💫" },
  { value: "rnb", label: "R&B", emoji: "🎤" },
  { value: "lofi", label: "Lo-Fi", emoji: "☕" },
  { value: "afrobeats", label: "Afrobeats", emoji: "🌍" },
  { value: "hip_hop", label: "Hip Hop", emoji: "🎧" },
  { value: "jazz", label: "Jazz", emoji: "🎷" },
  { value: "electronic", label: "Electronic", emoji: "⚡" },
];

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export default function PromptPanel({ onGenerate, generating }) {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("trap_soul");
  const [tempo, setTempo] = useState(120);
  const [key, setKey] = useState("C");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate({ prompt, genre, tempo, key });
  };

  const quickPrompts = [
    "Dark atmospheric melody with heavy bass",
    "Uplifting chord progression with smooth vocals",
    "Jazzy piano chords with swing drums",
    "Hypnotic trap beat with melodic bells"
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1 text-white">AI Music Generator</h2>
        <p className="text-xs text-[#A1A1AA]">Describe your vision</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-white mb-2 block">Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A smooth R&B track with soulful chords, warm bass, and laid-back drums..."
            className="bg-[#1C1C1F] border-[#252529] text-white placeholder:text-[#52525B] min-h-32 resize-none focus:border-[#00D9FF] focus:ring-[#00D9FF]"
          />
          <div className="mt-2 space-y-1">
            <p className="text-xs text-[#A1A1AA] mb-2">Quick prompts:</p>
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => setPrompt(qp)}
                className="block w-full text-left text-xs text-[#71717A] hover:text-[#00D9FF] transition-colors py-1"
              >
                → {qp}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-white mb-2 block">Genre Preset</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="bg-[#1C1C1F] border-[#252529] text-white focus:border-[#00D9FF] focus:ring-[#00D9FF]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1C1C1F] border-[#252529]">
              {PRESETS.map(preset => (
                <SelectItem 
                  key={preset.value} 
                  value={preset.value}
                  className="text-white hover:bg-[#252529] focus:bg-[#252529]"
                >
                  <span className="mr-2">{preset.emoji}</span>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-white mb-2 block">Key</Label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger className="bg-[#1C1C1F] border-[#252529] text-white focus:border-[#00D9FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1F] border-[#252529]">
                {KEYS.map(k => (
                  <SelectItem 
                    key={k} 
                    value={k}
                    className="text-white hover:bg-[#252529]"
                  >
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-white mb-2 block">
              Tempo: {tempo} BPM
            </Label>
            <Slider
              value={[tempo]}
              onValueChange={([v]) => setTempo(v)}
              min={60}
              max={200}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="w-full bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90 text-white font-medium h-12 text-base"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Music
            </>
          )}
        </Button>
      </div>

      <div className="pt-4 border-t border-[#252529]">
        <h3 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wide mb-3">
          Generation Tips
        </h3>
        <ul className="space-y-2 text-xs text-[#71717A]">
          <li>• Be specific about mood and energy</li>
          <li>• Mention instruments you want</li>
          <li>• Describe the rhythm style</li>
          <li>• Reference artists or genres</li>
        </ul>
      </div>
    </div>
  );
}