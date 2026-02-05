import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Music2, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CHORD_PROGRESSIONS } from "./MusicTheory";

export default function ChordProgressionGenerator({ onApply }) {
  const [genre, setGenre] = useState("trap_soul");
  const [mood, setMood] = useState("emotional");
  const [key, setKey] = useState("C");
  const [generating, setGenerating] = useState(false);
  const [progression, setProgression] = useState(null);

  const generateProgression = async () => {
    setGenerating(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a chord progression for ${genre} music with a ${mood} mood in the key of ${key}.

Consider:
- Genre-specific harmony (${genre} often uses specific progressions)
- Emotional impact (${mood} feeling)
- Voice leading and smooth transitions
- Modern production techniques

Return a 4-bar chord progression with:
- Chord symbols (e.g., "Cmaj7", "Dm7", "G7")
- Roman numeral analysis
- MIDI notes for each chord
- Description of the emotional effect

Make it professional and musically sophisticated.`,
        response_json_schema: {
          type: "object",
          properties: {
            progression: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  chord_symbol: { type: "string" },
                  roman_numeral: { type: "string" },
                  beat: { type: "number" },
                  duration: { type: "number" },
                  notes: {
                    type: "array",
                    items: { type: "number" }
                  }
                }
              }
            },
            description: { type: "string" },
            suggested_melody_notes: {
              type: "array",
              items: { type: "number" }
            }
          }
        }
      });
      
      setProgression(result);
      toast.success("Chord progression generated!");
    } catch (error) {
      toast.error("Failed to generate progression");
    }
    
    setGenerating(false);
  };

  const applyToProject = () => {
    if (!progression) return;
    onApply(progression);
    toast.success("Applied to project!");
  };

  return (
    <Card className="bg-[#141416] border-[#252529]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Music2 className="w-5 h-5 text-[#FFB800]" />
          Chord Progression Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-[#A1A1AA]">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-[#1C1C1F] border-[#252529] text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1F] border-[#252529]">
                <SelectItem value="trap_soul" className="text-white">Trap Soul</SelectItem>
                <SelectItem value="rnb" className="text-white">R&B</SelectItem>
                <SelectItem value="lofi" className="text-white">Lo-Fi</SelectItem>
                <SelectItem value="jazz" className="text-white">Jazz</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-[#A1A1AA]">Mood</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-[#1C1C1F] border-[#252529] text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1F] border-[#252529]">
                <SelectItem value="emotional" className="text-white">Emotional</SelectItem>
                <SelectItem value="dark" className="text-white">Dark</SelectItem>
                <SelectItem value="uplifting" className="text-white">Uplifting</SelectItem>
                <SelectItem value="melancholic" className="text-white">Melancholic</SelectItem>
                <SelectItem value="energetic" className="text-white">Energetic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-[#A1A1AA]">Key</Label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger className="bg-[#1C1C1F] border-[#252529] text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1F] border-[#252529]">
                {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(k => (
                  <SelectItem key={k} value={k} className="text-white">{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={generateProgression}
          disabled={generating}
          className="w-full bg-gradient-to-r from-[#FFB800] to-[#00D9FF] hover:opacity-90"
        >
          {generating ? (
            <>Generating...</>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Progression
            </>
          )}
        </Button>

        {progression && (
          <div className="space-y-3 pt-3 border-t border-[#252529]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Generated Progression</span>
              <Button
                size="sm"
                variant="outline"
                onClick={applyToProject}
                className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
              >
                <Copy className="w-3 h-3 mr-1" />
                Apply
              </Button>
            </div>

            <div className="bg-[#0A0A0B] rounded-lg p-3 space-y-2">
              {progression.progression?.map((chord, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[#00D9FF] font-mono">{chord.chord_symbol}</span>
                  <span className="text-[#71717A]">{chord.roman_numeral}</span>
                  <span className="text-[#FFB800] text-xs">{chord.notes?.length} notes</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#A1A1AA] italic">{progression.description}</p>
          </div>
        )}

        <div className="pt-3 border-t border-[#252529]">
          <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase mb-2">Quick Presets</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CHORD_PROGRESSIONS).slice(0, 4).map(([genreName, progressions]) => (
              <Button
                key={genreName}
                variant="outline"
                size="sm"
                onClick={() => {
                  setGenre(genreName);
                  setTimeout(generateProgression, 100);
                }}
                className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white text-xs"
              >
                {genreName.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}