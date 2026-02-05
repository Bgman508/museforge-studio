
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, Save, Sparkles, Undo2, Redo2, Music2, FolderOpen, Library, Users } from "lucide-react";
import { toast } from "sonner";
import { audioEngine } from "../components/studio/AudioEngine";
import { undoManager } from "../components/studio/UndoRedoManager";
import { GROOVE_TEMPLATES } from "../components/studio/MusicTheory";

import PromptPanel from "../components/studio/PromptPanel";
import EnhancedPianoRoll from "../components/studio/EnhancedPianoRoll";
import MixerPanel from "../components/studio/MixerPanel";
import TransportControls from "../components/studio/TransportControls";
import AIAssistant from "../components/studio/AIAssistant";
import ChordProgressionGenerator from "../components/studio/ChordProgressionGenerator";
import SectionMarkers from "../components/studio/SectionMarkers";
import HumanizationControls from "../components/studio/HumanizationControls";
import ExportModal from "../components/studio/ExportModal";
import TemplateLibrary from "../components/studio/TemplateLibrary";
import SampleBrowser from "../components/studio/SampleBrowser";
import CollaborationPanel from "../components/studio/CollaborationPanel";
import MasteringEngine from "../components/studio/MasteringEngine";

export default function Studio() {
  const [currentProject, setCurrentProject] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showChordGen, setShowChordGen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSampleBrowser, setShowSampleBrowser] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sections, setSections] = useState([]);
  const [loopSection, setLoopSection] = useState(null);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showMastering, setShowMastering] = useState(false);

  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        isPlaying ? handleStop() : handlePlay();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (currentProject) {
          saveMutation.mutate();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (currentProject) {
          setShowExport(true);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        setShowTemplates(true);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setShowSampleBrowser(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentProject]);

  const updateProject = useCallback((newProject) => {
    undoManager.pushState(newProject);
    setCurrentProject(newProject);
  }, []);

  const handleUndo = () => {
    const prevState = undoManager.undo();
    if (prevState) {
      setCurrentProject(prevState);
      toast.success("Undone");
    }
  };

  const handleRedo = () => {
    const nextState = undoManager.redo();
    if (nextState) {
      setCurrentProject(nextState);
      toast.success("Redone");
    }
  };

  const generateMutation = useMutation({
    mutationFn: async (params) => {
      setGenerating(true);
      
      const grooveTemplate = GROOVE_TEMPLATES[params.genre];
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional music producer AI. Generate a MIDI composition:

"${params.prompt}"

Genre: ${params.genre} | Tempo: ${params.tempo} BPM | Key: ${params.key}

Create 4 tracks with realistic MIDI notes:
1. Melody (lead synth) - memorable melodic phrases in key
2. Chords (harmony) - chord progression with proper voicing
3. Bass - root notes following chords, octave 2-3
4. Drums - kick (note 36), snare (note 38), hihat (note 42)

Each note needs: note (MIDI number), time (beat position), duration (beats), velocity (0-127)
Make it 16-32 beats long, musically coherent, and professional.`,
        response_json_schema: {
          type: "object",
          properties: {
            tracks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  instrument: { type: "string" },
                  color: { type: "string" },
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
            },
            totalBeats: { type: "number" }
          }
        }
      });
      
      setGenerating(false);
      return { ...result, ...params };
    },
    onSuccess: (data) => {
      const projectData = {
        name: `${data.genre.replace('_', ' ')} - ${Date.now()}`,
        prompt: data.prompt,
        genre: data.genre,
        tempo: data.tempo,
        key: data.key,
        tracks: data.tracks?.map((track, i) => ({
          ...track,
          volume: 0.8,
          pan: 0,
          muted: false,
          color: track.color || ['#00D9FF', '#FFB800', '#9333EA', '#EF4444'][i]
        })),
        midi_data: data
      };
      
      updateProject(projectData);
      undoManager.clear();
      undoManager.pushState(projectData);
      
      toast.success("🎵 Composition generated!");
    },
    onError: () => {
      setGenerating(false);
      toast.error("Failed to generate music");
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.MIDIProject.create(currentProject);
    },
    onSuccess: () => {
      toast.success("💾 Project saved!");
    }
  });

  const handleGenerate = (params) => {
    generateMutation.mutate(params);
  };

  const handleRegenerate = async (instruction) => {
    if (!currentProject) return;
    
    setGenerating(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Modify this MIDI composition:

Original: ${currentProject.prompt}
Instruction: ${instruction}

Current: ${currentProject.tracks.length} tracks, ${currentProject.tempo} BPM, Key ${currentProject.key}

Return COMPLETE updated tracks with all notes. Maintain musical coherence.`,
        response_json_schema: {
          type: "object",
          properties: {
            tracks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  instrument: { type: "string" },
                  color: { type: "string" },
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
            },
            totalBeats: { type: "number" }
          }
        }
      });
      
      updateProject({
        ...currentProject,
        tracks: result.tracks.map((track, i) => ({
          ...track,
          volume: currentProject.tracks[i]?.volume || 0.8,
          pan: currentProject.tracks[i]?.pan || 0,
          muted: currentProject.tracks[i]?.muted || false,
          color: track.color || currentProject.tracks[i]?.color || '#00D9FF'
        })),
        midi_data: result
      });
      
      toast.success("✨ Regenerated!");
    } catch (error) {
      toast.error("Regeneration failed");
    }
    
    setGenerating(false);
  };

  const handlePlay = () => {
    if (!currentProject) {
      toast.error("No project loaded");
      return;
    }
    
    try {
      const options = loopSection ? {
        startTime: loopSection.start_beat,
        endTime: loopSection.end_beat,
        loop: true
      } : {};
      
      audioEngine.play(currentProject, options);
      setIsPlaying(true);
      toast.success("▶️ Playing");
    } catch (error) {
      toast.error("Playback error");
      console.error(error);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setLoopSection(null);
    toast.info("⏹️ Stopped");
  };

  const handlePlaySection = (section) => {
    setLoopSection(section);
    audioEngine.play(currentProject, {
      startTime: section.start_beat,
      endTime: section.end_beat,
      loop: true
    });
    setIsPlaying(true);
    toast.success(`🔁 Looping ${section.name}`);
  };

  const handleApplyChords = (progression) => {
    if (!currentProject) return;

    const chordTrack = {
      name: "AI Chords",
      instrument: "Chords",
      color: "#FFB800",
      volume: 0.7,
      pan: 0,
      muted: false,
      notes: []
    };

    progression.progression?.forEach(chord => {
      chord.notes?.forEach(note => {
        chordTrack.notes.push({
          note: note,
          time: chord.beat,
          duration: chord.duration,
          velocity: 85
        });
      });
    });

    updateProject({
      ...currentProject,
      tracks: [...currentProject.tracks, chordTrack]
    });

    toast.success("Chord progression added!");
  };

  const handleLoadTemplate = (templateData) => {
    updateProject(templateData);
    undoManager.clear();
    undoManager.pushState(templateData);
  };

  const handleAddSample = (sample) => {
    toast.success(`Sample "${sample.name}" added to library`);
  };

  const handleMasteringApplied = (masteredProject) => {
    updateProject(masteredProject);
    toast.success("✨ Mastering applied!");
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#0A0A0B]">
      <div className="h-16 bg-[#141416] border-b border-[#252529] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <TransportControls 
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onStop={handleStop}
            disabled={!currentProject || generating}
          />
          <div className="h-6 w-px bg-[#252529]" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={!undoManager.canUndo()}
              className="text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]"
              title="Undo (Cmd+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={!undoManager.canRedo()}
              className="text-[#A1A1AA] hover:text-white hover:bg-[#1C1C1F]"
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-6 w-px bg-[#252529]" />
          <div className="text-sm">
            {currentProject && (
              <>
                <span className="text-[#00D9FF] font-mono">{currentProject.tempo}</span>
                <span className="text-[#A1A1AA] mx-2">BPM</span>
                <span className="text-[#FFB800] font-mono">{currentProject.key}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMastering(true)}
            disabled={!currentProject}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Master
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCollaboration(!showCollaboration)}
            disabled={!currentProject}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Collab
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(true)}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
            title="Templates (Cmd+T)"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSampleBrowser(true)}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
            title="Sample Library (Cmd+L)"
          >
            <Library className="w-4 h-4 mr-2" />
            Samples
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChordGen(!showChordGen)}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
          >
            <Music2 className="w-4 h-4 mr-2" />
            Chords
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAssistant(!showAssistant)}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={!currentProject}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
            title="Save (Cmd+S)"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={() => setShowExport(true)}
            disabled={!currentProject}
            className="bg-gradient-to-r from-[#00D9FF] to-[#FFB800] hover:opacity-90 text-white font-medium"
            title="Export (Cmd+E)"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-[#141416] border-r border-[#252529] overflow-y-auto">
          <PromptPanel onGenerate={handleGenerate} generating={generating} />
          
          <div className="p-4 border-t border-[#252529]">
            <SectionMarkers 
              sections={sections}
              onUpdate={setSections}
              onPlaySection={handlePlaySection}
            />
          </div>

          <div className="p-4 border-t border-[#252529]">
            <HumanizationControls
              project={currentProject}
              onProjectUpdate={updateProject}
            />
          </div>
        </div>

        <div className="flex-1 bg-[#0A0A0B] overflow-hidden">
          <EnhancedPianoRoll
            project={currentProject}
            onProjectUpdate={updateProject}
            isPlaying={isPlaying}
            selectedTrackIndex={selectedTrackIndex}
          />
        </div>

        <div className="w-80 bg-[#141416] border-l border-[#252529] overflow-y-auto">
          <MixerPanel 
            tracks={currentProject?.tracks || []}
            selectedTrackIndex={selectedTrackIndex}
            onTrackSelect={setSelectedTrackIndex}
            onTrackUpdate={(index, updates) => {
              if (!currentProject) return;
              const newTracks = [...currentProject.tracks];
              newTracks[index] = { ...newTracks[index], ...updates };
              updateProject({ ...currentProject, tracks: newTracks });
              
              if (updates.volume !== undefined) {
                audioEngine.setTrackVolume(newTracks[index].name, updates.volume);
              }
              if (updates.pan !== undefined) {
                audioEngine.setTrackPan(newTracks[index].name, updates.pan);
              }
            }}
          />
        </div>

        {showAssistant && (
          <AIAssistant 
            onClose={() => setShowAssistant(false)}
            onSuggest={handleRegenerate}
            currentProject={currentProject}
          />
        )}

        {showCollaboration && currentProject && (
          <CollaborationPanel
            project={currentProject}
            onClose={() => setShowCollaboration(false)}
          />
        )}

        {showChordGen && (
          <div className="absolute right-96 top-20 w-96 z-50">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChordGen(false)}
                className="absolute -top-2 -right-2 text-white hover:bg-[#252529] z-10"
              >
                ✕
              </Button>
              <ChordProgressionGenerator onApply={handleApplyChords} />
            </div>
          </div>
        )}
      </div>

      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        project={currentProject}
      />

      <TemplateLibrary
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleLoadTemplate}
      />

      <SampleBrowser
        open={showSampleBrowser}
        onClose={() => setShowSampleBrowser(false)}
        onAddSample={handleAddSample}
      />

      <MasteringEngine
        open={showMastering}
        onClose={() => setShowMastering(false)}
        project={currentProject}
        onMasteringApplied={handleMasteringApplied}
      />

      <div className="h-8 bg-[#141416] border-t border-[#252529] flex items-center px-6 text-xs text-[#71717A]">
        <span>💡 Pro Features: AI Mastering • Real-time Collaboration • Advanced Piano Roll</span>
      </div>
    </div>
  );
}
