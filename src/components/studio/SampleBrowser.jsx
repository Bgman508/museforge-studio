import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Play, Download, Upload, X } from "lucide-react";
import { toast } from "sonner";

const SAMPLE_LIBRARY = {
  drums: [
    { id: "kick_808", name: "808 Kick", category: "drums", duration: 1.2, bpm: 140 },
    { id: "snare_clap", name: "Clap Snare", category: "drums", duration: 0.5, bpm: 140 },
    { id: "hihat_closed", name: "Closed Hi-Hat", category: "drums", duration: 0.2, bpm: 140 },
    { id: "hihat_open", name: "Open Hi-Hat", category: "drums", duration: 0.8, bpm: 140 },
    { id: "rim_shot", name: "Rim Shot", category: "drums", duration: 0.3, bpm: 140 },
  ],
  loops: [
    { id: "piano_loop_1", name: "Jazz Piano Loop", category: "loops", duration: 8, bpm: 90 },
    { id: "guitar_loop_1", name: "Acoustic Guitar", category: "loops", duration: 4, bpm: 120 },
    { id: "bass_loop_1", name: "Funk Bass Groove", category: "loops", duration: 4, bpm: 110 },
    { id: "synth_pad_1", name: "Ambient Pad", category: "loops", duration: 16, bpm: 85 },
  ],
  oneshots: [
    { id: "synth_stab", name: "Synth Stab", category: "oneshots", duration: 1, bpm: null },
    { id: "vocal_chop", name: "Vocal Chop", category: "oneshots", duration: 0.5, bpm: null },
    { id: "fx_riser", name: "Riser FX", category: "oneshots", duration: 2, bpm: null },
    { id: "fx_impact", name: "Impact Hit", category: "oneshots", duration: 1.5, bpm: null },
  ],
  vocals: [
    { id: "vocal_ah", name: "Vocal 'Ah'", category: "vocals", duration: 2, bpm: null },
    { id: "vocal_oh", name: "Vocal 'Oh'", category: "vocals", duration: 1.5, bpm: null },
    { id: "vocal_phrase", name: "Phrase Sample", category: "vocals", duration: 4, bpm: 120 },
  ]
};

export default function SampleBrowser({ open, onClose, onAddSample }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [playingSample, setPlayingSample] = useState(null);

  const allSamples = Object.values(SAMPLE_LIBRARY).flat();
  const filteredSamples = allSamples.filter(sample => {
    const matchesSearch = sample.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || sample.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlaySample = (sample) => {
    setPlayingSample(sample.id);
    toast.success(`Playing: ${sample.name}`);
    setTimeout(() => setPlayingSample(null), sample.duration * 1000);
  };

  const handleAddSample = (sample) => {
    onAddSample(sample);
    toast.success(`Added ${sample.name} to project`);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        toast.success(`Uploaded: ${file.name}`);
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-[#252529] text-white max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#00D9FF]" />
              Sample Library
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpload}
                className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
              >
                <Upload className="w-3 h-3 mr-2" />
                Upload
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#A1A1AA] hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search samples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#1C1C1F] border-[#252529] text-white"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["all", "drums", "loops", "oneshots", "vocals"].map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat 
                  ? "bg-[#00D9FF] hover:bg-[#00B8D4]" 
                  : "bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
                }
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredSamples.map((sample) => (
              <Card 
                key={sample.id}
                className="bg-[#1C1C1F] border-[#252529] hover:border-[#00D9FF] transition-all"
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePlaySample(sample)}
                        className={`${playingSample === sample.id ? 'text-[#00D9FF]' : 'text-[#A1A1AA]'} hover:text-white`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <div>
                        <div className="text-sm font-medium text-white">{sample.name}</div>
                        <div className="text-xs text-[#71717A] flex items-center gap-2">
                          <span>{sample.duration}s</span>
                          {sample.bpm && <span>• {sample.bpm} BPM</span>}
                          <span className="px-2 py-0.5 bg-[#0A0A0B] rounded">
                            {sample.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSample(sample)}
                        className="bg-[#0A0A0B] border-[#252529] hover:bg-[#252529] text-white"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSamples.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#A1A1AA]">No samples found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}