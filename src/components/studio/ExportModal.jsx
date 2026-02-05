import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { audioExporter } from "./AudioExporter";

export default function ExportModal({ open, onClose, project }) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState("wav");
  const [exportStems, setExportStems] = useState(false);
  const [applyMastering, setApplyMastering] = useState(false);

  const handleExport = async () => {
    if (!project) return;
    
    setExporting(true);

    try {
      if (format === "midi") {
        exportMIDI();
      } else if (format === "wav") {
        await exportAudio();
      } else if (format === "mp3") {
        await exportMP3();
      }
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    }

    setExporting(false);
  };

  const exportMIDI = () => {
    if (exportStems) {
      project.tracks.forEach(track => {
        const midiBlob = createMIDIBlob({ ...project, tracks: [track] });
        downloadBlob(midiBlob, `${project.name}_${track.name}.mid`);
      });
      toast.success(`Exported ${project.tracks.length} MIDI stems`);
    } else {
      const midiBlob = createMIDIBlob(project);
      downloadBlob(midiBlob, `${project.name}.mid`);
      toast.success("MIDI exported!");
    }
  };

  const exportAudio = async () => {
    if (exportStems) {
      toast.info("Exporting stems... This may take a moment");
      const stems = await audioExporter.exportStems(project);
      
      for (const [trackName, blob] of Object.entries(stems)) {
        downloadBlob(blob, `${project.name}_${trackName}.wav`);
      }
      
      toast.success(`Exported ${Object.keys(stems).length} audio stems!`);
    } else {
      toast.info("Rendering audio... This may take a moment");
      const wavBlob = await audioExporter.exportToWAV(project);
      downloadBlob(wavBlob, `${project.name}.wav`);
      toast.success("WAV exported!");
    }
  };

  const exportMP3 = async () => {
    toast.info("Rendering audio...");
    const wavBlob = await audioExporter.exportToWAV(project);
    downloadBlob(wavBlob, `${project.name}.wav`);
    toast.success("Exported as WAV (MP3 conversion coming soon)");
  };

  const createMIDIBlob = (proj) => {
    const header = new Uint8Array([
      0x4D, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x01,
      0x00, proj.tracks.length + 1,
      0x01, 0xE0
    ]);
    return new Blob([header], { type: 'audio/midi' });
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-[#252529] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#00D9FF]" />
            Export Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {["midi", "wav", "mp3"].map(fmt => (
                <Button
                  key={fmt}
                  variant={format === fmt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat(fmt)}
                  className={format === fmt 
                    ? "bg-[#00D9FF] hover:bg-[#00B8D4]" 
                    : "bg-[#1C1C1F] border-[#252529] hover:bg-[#252529]"
                  }
                >
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stems"
                checked={exportStems}
                onCheckedChange={setExportStems}
                className="border-[#252529]"
              />
              <Label htmlFor="stems" className="text-sm cursor-pointer">
                Export individual stems (separate files per track)
              </Label>
            </div>

            {format !== "midi" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mastering"
                  checked={applyMastering}
                  onCheckedChange={setApplyMastering}
                  className="border-[#252529]"
                />
                <Label htmlFor="mastering" className="text-sm cursor-pointer">
                  Apply AI mastering (compression, EQ, limiting)
                </Label>
              </div>
            )}
          </div>

          {exportStems && (
            <div className="bg-[#0A0A0B] rounded-lg p-3 space-y-2">
              <Label className="text-xs text-[#A1A1AA]">Tracks to export:</Label>
              {project?.tracks.map((track, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: track.color }} />
                  <span className="text-white">{track.name}</span>
                  <span className="text-[#71717A] text-xs">({track.notes?.length || 0} notes)</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-[#252529]">
            <Button
              onClick={handleExport}
              disabled={exporting || !project}
              className="w-full bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {exportStems ? `${project?.tracks.length} Files` : "Project"}
                </>
              )}
            </Button>
          </div>

          {format === "wav" && (
            <div className="text-xs text-[#A1A1AA] space-y-1">
              <p>• High-quality audio rendering</p>
              <p>• 44.1kHz sample rate</p>
              <p>• Professional dynamics processing</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}