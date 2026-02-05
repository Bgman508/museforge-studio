import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Wand2 } from "lucide-react";
import { humanizeNotes, applySwing } from "./MusicTheory";
import { toast } from "sonner";

export default function HumanizationControls({ project, onProjectUpdate }) {
  const [timingAmount, setTimingAmount] = useState(0.5);
  const [velocityAmount, setVelocityAmount] = useState(0.5);
  const [swingAmount, setSwingAmount] = useState(0.5);

  const applyHumanization = () => {
    if (!project) return;

    const newProject = { ...project };
    newProject.tracks = project.tracks.map(track => ({
      ...track,
      notes: humanizeNotes(track.notes || [], timingAmount)
    }));

    onProjectUpdate(newProject);
    toast.success("✨ Humanization applied!");
  };

  const applySwingTiming = () => {
    if (!project) return;

    const newProject = { ...project };
    newProject.tracks = project.tracks.map(track => ({
      ...track,
      notes: applySwing(track.notes || [], swingAmount)
    }));

    onProjectUpdate(newProject);
    toast.success("🎵 Swing applied!");
  };

  return (
    <div className="space-y-4 bg-[#1C1C1F] rounded-lg p-4 border border-[#252529]">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-[#FFB800]" />
        Humanization
      </h3>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-[#A1A1AA]">Timing Variation</Label>
            <span className="text-xs text-white font-mono">{Math.round(timingAmount * 100)}%</span>
          </div>
          <Slider
            value={[timingAmount * 100]}
            onValueChange={([v]) => setTimingAmount(v / 100)}
            max={100}
            step={1}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-[#A1A1AA]">Velocity Variation</Label>
            <span className="text-xs text-white font-mono">{Math.round(velocityAmount * 100)}%</span>
          </div>
          <Slider
            value={[velocityAmount * 100]}
            onValueChange={([v]) => setVelocityAmount(v / 100)}
            max={100}
            step={1}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-[#A1A1AA]">Swing Amount</Label>
            <span className="text-xs text-white font-mono">{Math.round(swingAmount * 100)}%</span>
          </div>
          <Slider
            value={[swingAmount * 100]}
            onValueChange={([v]) => setSwingAmount(v / 100)}
            max={100}
            step={1}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            size="sm"
            onClick={applyHumanization}
            disabled={!project}
            className="bg-[#00D9FF] hover:bg-[#00B8D4] text-white text-xs"
          >
            Apply Humanization
          </Button>
          <Button
            size="sm"
            onClick={applySwingTiming}
            disabled={!project}
            className="bg-[#FFB800] hover:bg-[#F59E0B] text-white text-xs"
          >
            Apply Swing
          </Button>
        </div>
      </div>

      <div className="pt-3 border-t border-[#252529] text-xs text-[#71717A] space-y-1">
        <p>• Adds natural timing imperfections</p>
        <p>• Varies note velocities</p>
        <p>• Creates groove and feel</p>
      </div>
    </div>
  );
}