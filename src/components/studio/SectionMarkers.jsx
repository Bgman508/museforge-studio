import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

const SECTION_COLORS = {
  intro: "#3B82F6",
  verse: "#10B981",
  chorus: "#F59E0B",
  bridge: "#8B5CF6",
  breakdown: "#EF4444",
  drop: "#EC4899",
  outro: "#6B7280",
  custom: "#00D9FF"
};

export default function SectionMarkers({ sections = [], onUpdate, onPlaySection }) {
  const [editingSection, setEditingSection] = useState(null);

  const addSection = () => {
    const newSection = {
      id: Date.now(),
      name: "New Section",
      type: "verse",
      start_beat: 0,
      end_beat: 16,
      color: SECTION_COLORS.verse
    };
    onUpdate([...sections, newSection]);
    setEditingSection(newSection.id);
  };

  const updateSection = (id, updates) => {
    const updated = sections.map(s => s.id === id ? { ...s, ...updates, color: SECTION_COLORS[updates.type] || s.color } : s);
    onUpdate(updated);
  };

  const deleteSection = (id) => {
    onUpdate(sections.filter(s => s.id !== id));
    toast.success("Section deleted");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Song Sections</h3>
        <Button
          size="sm"
          onClick={addSection}
          className="bg-[#00D9FF] hover:bg-[#00B8D4] text-white"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {sections.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#71717A]">
            No sections defined
          </div>
        ) : (
          sections.map(section => (
            <div
              key={section.id}
              className="bg-[#1C1C1F] border border-[#252529] rounded-lg p-3 space-y-2"
              style={{ borderLeftColor: section.color, borderLeftWidth: '3px' }}
            >
              {editingSection === section.id ? (
                <>
                  <Input
                    value={section.name}
                    onChange={(e) => updateSection(section.id, { name: e.target.value })}
                    className="bg-[#0A0A0B] border-[#252529] text-white text-sm"
                  />
                  <Select
                    value={section.type}
                    onValueChange={(type) => updateSection(section.id, { type })}
                  >
                    <SelectTrigger className="bg-[#0A0A0B] border-[#252529] text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1F] border-[#252529]">
                      {Object.keys(SECTION_COLORS).map(type => (
                        <SelectItem key={type} value={type} className="text-white text-xs">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={section.start_beat}
                      onChange={(e) => updateSection(section.id, { start_beat: parseInt(e.target.value) })}
                      className="bg-[#0A0A0B] border-[#252529] text-white text-xs"
                      placeholder="Start"
                    />
                    <Input
                      type="number"
                      value={section.end_beat}
                      onChange={(e) => updateSection(section.id, { end_beat: parseInt(e.target.value) })}
                      className="bg-[#0A0A0B] border-[#252529] text-white text-xs"
                      placeholder="End"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setEditingSection(null)}
                    className="w-full bg-[#00D9FF] hover:bg-[#00B8D4] text-white text-xs"
                  >
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{section.name}</div>
                      <div className="text-xs text-[#71717A]">
                        Bars {section.start_beat} - {section.end_beat} • {section.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPlaySection(section)}
                        className="text-[#00D9FF] hover:bg-[#252529]"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingSection(section.id)}
                        className="text-[#A1A1AA] hover:bg-[#252529]"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSection(section.id)}
                        className="text-[#EF4444] hover:bg-[#252529]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}