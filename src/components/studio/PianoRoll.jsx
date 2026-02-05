import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Music, Zap } from "lucide-react";

const COLORS = {
  melody: "#00D9FF",
  chords: "#FFB800",
  bass: "#9333EA",
  drums: "#EF4444"
};

export default function PianoRoll({ project, isPlaying, onRegenerate }) {
  const canvasRef = useRef(null);
  const [playheadPosition, setPlayheadPosition] = useState(0);

  useEffect(() => {
    if (!project || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Clear
    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#1C1C1F';
    ctx.lineWidth = 1;
    
    // Vertical lines (beats)
    const totalBeats = project.midi_data?.totalBeats || 32;
    const beatWidth = (width / 2) / totalBeats;
    for (let i = 0; i <= totalBeats; i++) {
      ctx.beginPath();
      ctx.moveTo(i * beatWidth, 0);
      ctx.lineTo(i * beatWidth, height / 2);
      ctx.stroke();
    }

    // Horizontal lines (notes)
    const noteHeight = (height / 2) / 88; // 88 piano keys
    for (let i = 0; i <= 88; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * noteHeight);
      ctx.lineTo(width / 2, i * noteHeight);
      ctx.stroke();
    }

    // Draw notes
    project.tracks?.forEach((track, trackIndex) => {
      const color = track.color || Object.values(COLORS)[trackIndex % 4];
      ctx.fillStyle = color;
      ctx.globalAlpha = track.muted ? 0.2 : 0.8;

      track.notes?.forEach(note => {
        const x = (note.time * beatWidth);
        const y = ((127 - note.note) * noteHeight);
        const w = (note.duration * beatWidth);
        const h = noteHeight * 0.8;

        // Note rectangle
        ctx.fillRect(x, y, w, h);
        
        // Subtle border
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        ctx.globalAlpha = 0.8;
      });
    });

    // Draw playhead
    if (isPlaying) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadPosition * (width / 2), 0);
      ctx.lineTo(playheadPosition * (width / 2), height / 2);
      ctx.stroke();
    }

  }, [project, playheadPosition, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayheadPosition(0);
      return;
    }

    const interval = setInterval(() => {
      setPlayheadPosition(prev => {
        if (prev >= 1) return 0;
        return prev + 0.01;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const regenerateOptions = [
    { label: "Add Counter Melody", icon: Plus, instruction: "Add a counter melody track that complements the main melody" },
    { label: "Change Chords", icon: RefreshCw, instruction: "Change the chord progression to something more interesting while keeping the same vibe" },
    { label: "Humanize Timing", icon: Zap, instruction: "Add subtle timing variations and velocity changes to make it feel more human and less robotic" },
    { label: "Add Variation", icon: Music, instruction: "Add variation to the arrangement - change some elements in the second half" }
  ];

  return (
    <div className="h-full flex flex-col">
      {!project ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#00D9FF] to-[#FFB800] opacity-20 flex items-center justify-center">
              <Music className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Project Loaded</h3>
            <p className="text-[#A1A1AA] text-sm">
              Start by generating music from the prompt panel
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-12 bg-[#141416] border-b border-[#252529] flex items-center justify-between px-4">
            <h3 className="text-sm font-medium text-white">Piano Roll</h3>
            <div className="flex items-center gap-2">
              {regenerateOptions.map((option, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => onRegenerate(option.instruction)}
                  className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white text-xs"
                >
                  <option.icon className="w-3 h-3 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <canvas 
              ref={canvasRef}
              className="w-full h-full rounded-lg border border-[#252529]"
            />
          </div>
        </>
      )}
    </div>
  );
}