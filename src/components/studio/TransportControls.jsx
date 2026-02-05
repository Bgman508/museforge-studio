import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, SkipBack, SkipForward } from "lucide-react";

export default function TransportControls({ isPlaying, onPlay, onStop, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]"
      >
        <SkipBack className="w-4 h-4" />
      </Button>
      
      {!isPlaying ? (
        <Button
          size="icon"
          onClick={onPlay}
          disabled={disabled}
          className="bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90 text-white"
        >
          <Play className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          onClick={onStop}
          className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
        >
          <Square className="w-4 h-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className="text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]"
      >
        <SkipForward className="w-4 h-4" />
      </Button>
    </div>
  );
}