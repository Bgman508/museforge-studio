import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Zap, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function MasteringEngine({ open, onClose, project, onMasteringApplied }) {
  const [processing, setProcessing] = useState(false);
  const [intensity, setIntensity] = useState(70);
  const [targetLoudness, setTargetLoudness] = useState(-14); // LUFS
  const [masteringSettings, setMasteringSettings] = useState(null);

  const analyzeMix = async () => {
    setProcessing(true);
    toast.info("Analyzing mix...");

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this music project and suggest mastering settings:

Project:
- Tempo: ${project.tempo} BPM
- Key: ${project.key}
- Genre: ${project.genre}
- Tracks: ${project.tracks.map(t => t.name).join(', ')}

Provide professional mastering recommendations:
1. EQ adjustments (low, mid, high in dB)
2. Compression settings (threshold, ratio, attack, release)
3. Limiter ceiling
4. Stereo width enhancement
5. Overall loudness target

Target loudness: ${targetLoudness} LUFS
Intensity: ${intensity}/100

Return precise settings for professional mastering.`,
        response_json_schema: {
          type: "object",
          properties: {
            eq: {
              type: "object",
              properties: {
                low: { type: "number", description: "dB adjustment" },
                mid: { type: "number" },
                high: { type: "number" }
              }
            },
            compression: {
              type: "object",
              properties: {
                threshold: { type: "number", description: "dB" },
                ratio: { type: "number" },
                attack: { type: "number", description: "ms" },
                release: { type: "number", description: "ms" }
              }
            },
            limiter: {
              type: "object",
              properties: {
                ceiling: { type: "number", description: "dB" },
                release: { type: "number", description: "ms" }
              }
            },
            stereo_width: { type: "number", description: "0-200%" },
            description: { type: "string" }
          }
        }
      });

      setMasteringSettings(result);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze mix");
    }

    setProcessing(false);
  };

  const applyMastering = () => {
    if (!masteringSettings) return;

    // Apply mastering settings to project
    const masteredProject = {
      ...project,
      mastering: {
        applied: true,
        settings: masteringSettings,
        intensity,
        targetLoudness
      }
    };

    onMasteringApplied(masteredProject);
    toast.success("🎵 Mastering applied!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-[#252529] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FFB800]" />
            AI Mastering Engine
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {!masteringSettings ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Mastering Intensity: {intensity}%
                  </Label>
                  <Slider
                    value={[intensity]}
                    onValueChange={([v]) => setIntensity(v)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-[#71717A] mt-2">
                    Higher intensity = more compression and limiting
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Target Loudness: {targetLoudness} LUFS
                  </Label>
                  <Slider
                    value={[targetLoudness + 20]}
                    onValueChange={([v]) => setTargetLoudness(v - 20)}
                    max={20}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-[#71717A] mt-2">
                    Industry standards: Spotify (-14), Apple Music (-16), YouTube (-13)
                  </p>
                </div>
              </div>

              <div className="bg-[#1C1C1F] rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FFB800]" />
                  AI Mastering Features:
                </h4>
                <ul className="text-[#A1A1AA] space-y-1">
                  <li>• Intelligent EQ for balanced frequency response</li>
                  <li>• Multi-band compression for dynamics control</li>
                  <li>• Precision limiting for loudness maximization</li>
                  <li>• Stereo width enhancement</li>
                  <li>• Genre-aware processing</li>
                </ul>
              </div>

              <Button
                onClick={analyzeMix}
                disabled={processing}
                className="w-full bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Mix...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analyze & Master
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-[#1C1C1F] rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Mastering Settings</h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-[#00D9FF] mb-2">EQ Adjustments</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="bg-[#0A0A0B] rounded p-2">
                        <div className="text-[#71717A]">Low</div>
                        <div className="text-white font-mono">
                          {masteringSettings.eq.low > 0 ? '+' : ''}{masteringSettings.eq.low} dB
                        </div>
                      </div>
                      <div className="bg-[#0A0A0B] rounded p-2">
                        <div className="text-[#71717A]">Mid</div>
                        <div className="text-white font-mono">
                          {masteringSettings.eq.mid > 0 ? '+' : ''}{masteringSettings.eq.mid} dB
                        </div>
                      </div>
                      <div className="bg-[#0A0A0B] rounded p-2">
                        <div className="text-[#71717A]">High</div>
                        <div className="text-white font-mono">
                          {masteringSettings.eq.high > 0 ? '+' : ''}{masteringSettings.eq.high} dB
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-[#FFB800] mb-2">Compression</h4>
                    <div className="bg-[#0A0A0B] rounded p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Threshold:</span>
                        <span className="text-white font-mono">{masteringSettings.compression.threshold} dB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Ratio:</span>
                        <span className="text-white font-mono">{masteringSettings.compression.ratio}:1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Attack:</span>
                        <span className="text-white font-mono">{masteringSettings.compression.attack} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Release:</span>
                        <span className="text-white font-mono">{masteringSettings.compression.release} ms</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-[#9333EA] mb-2">Limiting & Stereo</h4>
                    <div className="bg-[#0A0A0B] rounded p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Limiter Ceiling:</span>
                        <span className="text-white font-mono">{masteringSettings.limiter.ceiling} dB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717A]">Stereo Width:</span>
                        <span className="text-white font-mono">{masteringSettings.stereo_width}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#A1A1AA] italic pt-2 border-t border-[#252529]">
                  {masteringSettings.description}
                </p>
              </div>

              <Button
                onClick={applyMastering}
                className="w-full bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90"
              >
                <Zap className="w-4 h-4 mr-2" />
                Apply Mastering
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}