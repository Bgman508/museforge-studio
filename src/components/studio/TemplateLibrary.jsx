import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Music4, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

const BUILTIN_TEMPLATES = [
  {
    id: "trap_soul_starter",
    name: "Trap Soul Starter",
    genre: "trap_soul",
    description: "Atmospheric trap soul with lush chords and 808s",
    tempo: 140,
    key: "F#",
    thumbnail: "🎵",
    tracks: [
      {
        name: "Melody",
        instrument: "Lead",
        color: "#00D9FF",
        notes: [
          { note: 77, time: 0, duration: 0.5, velocity: 90 },
          { note: 75, time: 0.5, duration: 0.5, velocity: 85 },
          { note: 73, time: 1, duration: 1, velocity: 95 },
          { note: 70, time: 2, duration: 0.5, velocity: 80 },
          { note: 73, time: 2.5, duration: 0.5, velocity: 85 },
          { note: 75, time: 3, duration: 1, velocity: 90 }
        ]
      },
      {
        name: "Chords",
        instrument: "Pad",
        color: "#FFB800",
        notes: [
          { note: 65, time: 0, duration: 4, velocity: 70 },
          { note: 69, time: 0, duration: 4, velocity: 70 },
          { note: 73, time: 0, duration: 4, velocity: 70 }
        ]
      },
      {
        name: "Bass",
        instrument: "Bass",
        color: "#9333EA",
        notes: [
          { note: 41, time: 0, duration: 0.5, velocity: 110 },
          { note: 41, time: 1, duration: 0.5, velocity: 100 },
          { note: 41, time: 2, duration: 0.5, velocity: 110 },
          { note: 41, time: 3, duration: 0.5, velocity: 100 }
        ]
      },
      {
        name: "Drums",
        instrument: "Drums",
        color: "#EF4444",
        notes: [
          { note: 36, time: 0, duration: 0.25, velocity: 127 },
          { note: 42, time: 0.25, duration: 0.125, velocity: 80 },
          { note: 42, time: 0.5, duration: 0.125, velocity: 70 },
          { note: 38, time: 1, duration: 0.25, velocity: 100 },
          { note: 42, time: 1.5, duration: 0.125, velocity: 75 },
          { note: 36, time: 2, duration: 0.25, velocity: 120 },
          { note: 42, time: 2.5, duration: 0.125, velocity: 80 },
          { note: 38, time: 3, duration: 0.25, velocity: 100 }
        ]
      }
    ]
  },
  {
    id: "rnb_groove",
    name: "R&B Groove",
    genre: "rnb",
    description: "Smooth R&B with soulful chords and tight drums",
    tempo: 90,
    key: "Eb",
    thumbnail: "🎤",
    tracks: [
      {
        name: "Keys",
        instrument: "Pad",
        color: "#00D9FF",
        notes: [
          { note: 63, time: 0, duration: 2, velocity: 75 },
          { note: 67, time: 0, duration: 2, velocity: 75 },
          { note: 70, time: 0, duration: 2, velocity: 75 },
          { note: 65, time: 2, duration: 2, velocity: 75 },
          { note: 68, time: 2, duration: 2, velocity: 75 },
          { note: 72, time: 2, duration: 2, velocity: 75 }
        ]
      },
      {
        name: "Bass",
        instrument: "Bass",
        color: "#9333EA",
        notes: [
          { note: 39, time: 0, duration: 0.5, velocity: 105 },
          { note: 39, time: 1, duration: 0.5, velocity: 95 },
          { note: 41, time: 2, duration: 0.5, velocity: 105 },
          { note: 41, time: 3, duration: 0.5, velocity: 95 }
        ]
      },
      {
        name: "Drums",
        instrument: "Drums",
        color: "#EF4444",
        notes: [
          { note: 36, time: 0, duration: 0.25, velocity: 120 },
          { note: 38, time: 1, duration: 0.25, velocity: 110 },
          { note: 36, time: 2, duration: 0.25, velocity: 115 },
          { note: 38, time: 3, duration: 0.25, velocity: 110 },
          { note: 42, time: 0.5, duration: 0.125, velocity: 70 },
          { note: 42, time: 1.5, duration: 0.125, velocity: 70 },
          { note: 42, time: 2.5, duration: 0.125, velocity: 70 },
          { note: 42, time: 3.5, duration: 0.125, velocity: 70 }
        ]
      }
    ]
  },
  {
    id: "lofi_chill",
    name: "Lo-Fi Chill",
    genre: "lofi",
    description: "Laid-back lo-fi beat with jazzy chords",
    tempo: 85,
    key: "Am",
    thumbnail: "☕",
    tracks: [
      {
        name: "Piano",
        instrument: "Pad",
        color: "#FFB800",
        notes: [
          { note: 69, time: 0, duration: 1, velocity: 65 },
          { note: 72, time: 0, duration: 1, velocity: 65 },
          { note: 76, time: 0, duration: 1, velocity: 65 },
          { note: 67, time: 1.5, duration: 1, velocity: 60 },
          { note: 71, time: 1.5, duration: 1, velocity: 60 },
          { note: 74, time: 1.5, duration: 1, velocity: 60 }
        ]
      },
      {
        name: "Bass",
        instrument: "Bass",
        color: "#9333EA",
        notes: [
          { note: 45, time: 0, duration: 1, velocity: 90 },
          { note: 43, time: 2, duration: 1, velocity: 90 }
        ]
      },
      {
        name: "Drums",
        instrument: "Drums",
        color: "#EF4444",
        notes: [
          { note: 36, time: 0, duration: 0.2, velocity: 95 },
          { note: 38, time: 1, duration: 0.2, velocity: 85 },
          { note: 36, time: 2.5, duration: 0.2, velocity: 90 },
          { note: 38, time: 3, duration: 0.2, velocity: 85 },
          { note: 42, time: 0.333, duration: 0.1, velocity: 60 },
          { note: 42, time: 0.666, duration: 0.1, velocity: 55 },
          { note: 42, time: 1.333, duration: 0.1, velocity: 60 },
          { note: 42, time: 1.666, duration: 0.1, velocity: 55 }
        ]
      }
    ]
  },
  {
    id: "afrobeats_energy",
    name: "Afrobeats Energy",
    genre: "afrobeats",
    description: "Energetic Afrobeats with infectious rhythms",
    tempo: 110,
    key: "G",
    thumbnail: "🌍",
    tracks: [
      {
        name: "Lead",
        instrument: "Lead",
        color: "#00D9FF",
        notes: [
          { note: 79, time: 0, duration: 0.5, velocity: 100 },
          { note: 77, time: 0.5, duration: 0.5, velocity: 95 },
          { note: 74, time: 1, duration: 0.5, velocity: 100 },
          { note: 77, time: 1.5, duration: 0.5, velocity: 95 },
          { note: 79, time: 2, duration: 1, velocity: 105 }
        ]
      },
      {
        name: "Chords",
        instrument: "Pad",
        color: "#FFB800",
        notes: [
          { note: 67, time: 0, duration: 2, velocity: 75 },
          { note: 71, time: 0, duration: 2, velocity: 75 },
          { note: 74, time: 0, duration: 2, velocity: 75 },
          { note: 69, time: 2, duration: 2, velocity: 75 },
          { note: 72, time: 2, duration: 2, velocity: 75 },
          { note: 76, time: 2, duration: 2, velocity: 75 }
        ]
      },
      {
        name: "Bass",
        instrument: "Bass",
        color: "#9333EA",
        notes: [
          { note: 43, time: 0, duration: 0.25, velocity: 115 },
          { note: 43, time: 0.5, duration: 0.25, velocity: 105 },
          { note: 43, time: 1, duration: 0.25, velocity: 115 },
          { note: 43, time: 1.5, duration: 0.25, velocity: 105 },
          { note: 43, time: 2, duration: 0.25, velocity: 115 },
          { note: 43, time: 2.5, duration: 0.25, velocity: 105 },
          { note: 43, time: 3, duration: 0.25, velocity: 115 },
          { note: 43, time: 3.5, duration: 0.25, velocity: 105 }
        ]
      },
      {
        name: "Drums",
        instrument: "Drums",
        color: "#EF4444",
        notes: [
          { note: 36, time: 0, duration: 0.2, velocity: 125 },
          { note: 36, time: 1, duration: 0.2, velocity: 120 },
          { note: 36, time: 2, duration: 0.2, velocity: 125 },
          { note: 36, time: 3, duration: 0.2, velocity: 120 },
          { note: 38, time: 1, duration: 0.2, velocity: 110 },
          { note: 38, time: 3, duration: 0.2, velocity: 110 },
          { note: 42, time: 0.25, duration: 0.1, velocity: 80 },
          { note: 42, time: 0.5, duration: 0.1, velocity: 75 },
          { note: 42, time: 0.75, duration: 0.1, velocity: 70 },
          { note: 42, time: 1.25, duration: 0.1, velocity: 80 },
          { note: 42, time: 1.5, duration: 0.1, velocity: 75 },
          { note: 42, time: 2.25, duration: 0.1, velocity: 80 },
          { note: 42, time: 2.5, duration: 0.1, velocity: 75 },
          { note: 42, time: 3.25, duration: 0.1, velocity: 80 },
          { note: 42, time: 3.5, duration: 0.1, velocity: 75 }
        ]
      }
    ]
  }
];

export default function TemplateLibrary({ open, onClose, onSelectTemplate }) {
  const [selectedGenre, setSelectedGenre] = useState("all");

  const { data: userTemplates = [] } = useQuery({
    queryKey: ['project-templates'],
    queryFn: () => base44.entities.ProjectTemplate.list(),
    enabled: open
  });

  const allTemplates = [...BUILTIN_TEMPLATES, ...userTemplates];
  const filteredTemplates = selectedGenre === "all" 
    ? allTemplates 
    : allTemplates.filter(t => t.genre === selectedGenre);

  const handleSelectTemplate = (template) => {
    onSelectTemplate({
      name: `${template.name} - ${Date.now()}`,
      prompt: template.description,
      genre: template.genre,
      tempo: template.tempo,
      key: template.key,
      tracks: template.tracks.map(track => ({
        ...track,
        volume: 0.8,
        pan: 0,
        muted: false
      })),
      midi_data: {
        totalBeats: 16,
        tracks: template.tracks
      }
    });
    
    toast.success(`Loaded template: ${template.name}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-[#252529] text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFB800]" />
              Project Templates
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[#A1A1AA] hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "trap_soul", "rnb", "lofi", "afrobeats", "hip_hop", "jazz"].map(genre => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
                className={selectedGenre === genre 
                  ? "bg-[#00D9FF] hover:bg-[#00B8D4]" 
                  : "bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
                }
              >
                {genre === "all" ? "All" : genre.replace('_', ' ')}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id}
                className="bg-[#1C1C1F] border-[#252529] hover:border-[#00D9FF] transition-all cursor-pointer group"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{template.thumbnail}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1 group-hover:text-[#00D9FF] transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-xs text-[#A1A1AA] mb-2 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-[#0A0A0B] text-[#FFB800] px-2 py-1 rounded">
                          {template.tempo} BPM
                        </span>
                        <span className="bg-[#0A0A0B] text-[#00D9FF] px-2 py-1 rounded">
                          {template.key}
                        </span>
                        <span className="text-[#71717A]">
                          {template.tracks.length} tracks
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Music4 className="w-12 h-12 text-[#A1A1AA] mx-auto mb-3 opacity-50" />
              <p className="text-[#A1A1AA]">No templates found for this genre</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}