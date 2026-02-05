
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Headphones } from "lucide-react";
import { toast } from "sonner";

export default function MixerPanel({ tracks, selectedTrackIndex, onTrackSelect, onTrackUpdate }) {
  const previewTrack = (track, index) => {
    if (!track.notes || track.notes.length === 0) {
      toast.error("No notes to preview");
      return;
    }

    toast.success(`🎵 Preview: ${track.name} (${track.notes.length} notes)`);
  };

  if (!tracks || tracks.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-bold mb-4 text-white">Mixer</h2>
        <div className="text-center text-[#A1A1AA] text-sm py-8">
          No tracks loaded
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1 text-white">Mixer</h2>
        <p className="text-xs text-[#A1A1AA]">Track controls</p>
      </div>

      <div className="space-y-4">
        {tracks.map((track, index) => (
          <div 
            key={index}
            className={`bg-[#1C1C1F] border rounded-lg p-4 space-y-3 cursor-pointer transition-all ${
              selectedTrackIndex === index 
                ? 'border-[#00D9FF] ring-2 ring-[#00D9FF] ring-opacity-20' 
                : 'border-[#252529] hover:border-[#00D9FF]'
            }`}
            onClick={() => onTrackSelect(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: track.color || '#00D9FF' }}
                />
                <div>
                  <div className="text-sm font-medium text-white">{track.name}</div>
                  <div className="text-xs text-[#A1A1AA]">{track.instrument}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    previewTrack(track, index);
                  }}
                  className="text-[#FFB800] hover:text-[#00D9FF] hover:bg-[#252529]"
                >
                  <Headphones className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrackUpdate(index, { muted: !track.muted });
                  }}
                  className={track.muted ? "text-[#52525B]" : "text-[#00D9FF]"}
                >
                  {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA]">Volume</span>
                <span className="text-white font-mono">{Math.round((track.volume || 0.8) * 100)}%</span>
              </div>
              <Slider
                value={[(track.volume || 0.8) * 100]}
                onValueChange={([v]) => onTrackUpdate(index, { volume: v / 100 })}
                max={100}
                step={1}
                className="w-full"
                disabled={track.muted}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#252529]">
              <div className="flex-1 h-1 bg-[#0A0A0B] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#00D9FF] to-[#FFB800]"
                  style={{ 
                    width: `${Math.random() * 60 + 20}%`,
                    opacity: track.muted ? 0.2 : 1
                  }}
                />
              </div>
              <span className="text-xs text-[#A1A1AA] font-mono">{track.notes?.length || 0} notes</span>
            </div>

            {selectedTrackIndex === index && (
              <div className="pt-2 border-t border-[#252529]">
                <div className="text-xs text-[#00D9FF] font-semibold">✓ Editing this track</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-[#252529]">
        <div className="bg-gradient-to-r from-[#00D9FF]/10 to-[#FFB800]/10 rounded-lg p-4 border border-[#252529]">
          <div className="text-xs font-semibold text-white mb-2">Master Output</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[#0A0A0B] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00D9FF] to-[#FFB800] animate-pulse" style={{ width: '70%' }} />
            </div>
            <span className="text-xs font-mono text-[#A1A1AA]">-6dB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
