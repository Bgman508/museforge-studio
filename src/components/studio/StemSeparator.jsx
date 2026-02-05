import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Loader2, Music, Download } from "lucide-react";
import { toast } from "sonner";

export default function StemSeparator({ open, onClose, onTracksExtracted }) {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedTracks, setExtractedTracks] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    toast.info("Uploading audio file...");

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await extractMIDIFromAudio(file_url);
    } catch (error) {
      toast.error("Failed to upload file");
    }

    setUploading(false);
  };

  const extractMIDIFromAudio = async (fileUrl) => {
    setProcessing(true);
    toast.info("Analyzing audio... This may take a moment");

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this audio file and extract MIDI data:

Extract:
1. Melody notes (pitch, timing, duration)
2. Chord progression (harmony)
3. Bass line
4. Drum pattern (kick, snare, hi-hat positions)

Return complete MIDI data with accurate note timings and velocities.
Analyze the tempo and key signature from the audio.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            tempo: { type: "number" },
            key: { type: "string" },
            time_signature: { type: "string" },
            tracks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  instrument: { type: "string" },
                  notes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        note: { type: "number" },
                        time: { type: "number" },
                        duration: { type: "number" },
                        velocity: { type: "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setExtractedTracks(result);
      toast.success("✨ MIDI extracted from audio!");
    } catch (error) {
      toast.error("Failed to extract MIDI from audio");
      console.error(error);
    }

    setProcessing(false);
  };

  const handleApplyTracks = () => {
    if (!extractedTracks) return;
    
    const tracks = extractedTracks.tracks.map((track, i) => ({
      ...track,
      color: ['#00D9FF', '#FFB800', '#9333EA', '#EF4444'][i % 4],
      volume: 0.8,
      pan: 0,
      muted: false
    }));

    onTracksExtracted({
      name: `Extracted - ${Date.now()}`,
      prompt: "Extracted from audio file",
      tempo: extractedTracks.tempo || 120,
      key: extractedTracks.key || "C",
      tracks,
      midi_data: extractedTracks
    });

    setExtractedTracks(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-[#252529] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#FFB800]" />
            Audio to MIDI Converter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {!extractedTracks ? (
            <>
              <div className="border-2 border-dashed border-[#252529] rounded-lg p-12 text-center">
                {uploading || processing ? (
                  <div className="space-y-4">
                    <Loader2 className="w-12 h-12 mx-auto text-[#00D9FF] animate-spin" />
                    <p className="text-sm text-[#A1A1AA]">
                      {uploading ? "Uploading audio file..." : "Analyzing and extracting MIDI..."}
                    </p>
                    <p className="text-xs text-[#71717A]">
                      This may take 30-60 seconds depending on file size
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-[#A1A1AA]" />
                    <h3 className="text-lg font-semibold mb-2">Upload Audio File</h3>
                    <p className="text-sm text-[#A1A1AA] mb-6">
                      Upload an audio file (MP3, WAV, etc.) and our AI will extract MIDI notes
                    </p>
                    <Button
                      onClick={() => document.getElementById('audio-upload').click()}
                      className="bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              <div className="bg-[#1C1C1F] rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold text-white">AI Extraction Features:</h4>
                <ul className="text-[#A1A1AA] space-y-1">
                  <li>• Detects melody and pitch accurately</li>
                  <li>• Extracts chord progressions</li>
                  <li>• Identifies drum patterns</li>
                  <li>• Analyzes tempo and key</li>
                  <li>• Creates editable MIDI tracks</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#1C1C1F] rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Extraction Complete!</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#FFB800]">{extractedTracks.tempo} BPM</span>
                    <span className="text-sm text-[#00D9FF]">Key: {extractedTracks.key}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[#A1A1AA]">Extracted Tracks:</h4>
                  {extractedTracks.tracks?.map((track, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#0A0A0B] rounded p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#00D9FF]" />
                        <div>
                          <div className="text-sm font-medium text-white">{track.name}</div>
                          <div className="text-xs text-[#71717A]">{track.instrument}</div>
                        </div>
                      </div>
                      <span className="text-xs text-[#A1A1AA]">
                        {track.notes?.length || 0} notes
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyTracks}
                  className="flex-1 bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Apply to Project
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}