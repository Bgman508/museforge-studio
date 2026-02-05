import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Grid3x3, Copy, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { audioEngine } from "./AudioEngine";

const NOTE_HEIGHT = 12;
const BEAT_WIDTH = 60;
const PIANO_WIDTH = 60;

export default function EnhancedPianoRoll({ project, onProjectUpdate, isPlaying, selectedTrackIndex = 0 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [scroll, setScroll] = useState({ x: 0, y: 2000 });
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [dragState, setDragState] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [clipboard, setClipboard] = useState([]);
  const [hoveredNote, setHoveredNote] = useState(null);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [showGhostNotes, setShowGhostNotes] = useState(true);
  const [selectionBox, setSelectionBox] = useState(null);

  const gridSnap = useCallback((value) => {
    if (!snapToGrid) return value;
    const snapValue = 0.25; // 16th notes
    return Math.round(value / snapValue) * snapValue;
  }, [snapToGrid]);

  const pixelToTime = useCallback((x) => {
    return (x + scroll.x - PIANO_WIDTH) / (BEAT_WIDTH * zoom);
  }, [scroll.x, zoom]);

  const pixelToNote = useCallback((y) => {
    return 127 - Math.floor((y + scroll.y) / (NOTE_HEIGHT * zoom));
  }, [scroll.y, zoom]);

  const timeToPixel = useCallback((time) => {
    return time * BEAT_WIDTH * zoom + PIANO_WIDTH - scroll.x;
  }, [scroll.x, zoom]);

  const noteToPixel = useCallback((note) => {
    return (127 - note) * NOTE_HEIGHT * zoom - scroll.y;
  }, [scroll.y, zoom]);

  const getNoteAt = useCallback((x, y, trackIndex) => {
    if (!project || !project.tracks[trackIndex]) return null;
    
    const time = pixelToTime(x);
    const noteNum = pixelToNote(y);
    
    return project.tracks[trackIndex].notes?.find(note => 
      Math.abs(note.note - noteNum) < 1 &&
      time >= note.time &&
      time <= note.time + note.duration
    );
  }, [project, pixelToTime, pixelToNote]);

  const getNotesInBox = useCallback((box) => {
    if (!project || !project.tracks[selectedTrackIndex]) return [];
    
    const minTime = Math.min(pixelToTime(box.startX), pixelToTime(box.endX));
    const maxTime = Math.max(pixelToTime(box.startX), pixelToTime(box.endX));
    const minNote = Math.min(pixelToNote(box.startY), pixelToNote(box.endY));
    const maxNote = Math.max(pixelToNote(box.startY), pixelToNote(box.endY));
    
    return project.tracks[selectedTrackIndex].notes?.filter(note => 
      note.time >= minTime && note.time <= maxTime &&
      note.note >= minNote && note.note <= maxNote
    ) || [];
  }, [project, selectedTrackIndex, pixelToTime, pixelToNote]);

  const playNotePreview = useCallback((noteNum) => {
    audioEngine.init();
    const frequency = audioEngine.midiToFrequency(noteNum);
    const synth = audioEngine.createSynth('melody', frequency, 0, 0.3, 100, 0.8);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!project) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Piano key preview
    if (x < PIANO_WIDTH) {
      const noteNum = pixelToNote(y);
      playNotePreview(noteNum);
      return;
    }

    const clickedNote = getNoteAt(x, y, selectedTrackIndex);

    if (e.button === 0) { // Left click
      if (e.shiftKey && clickedNote) {
        // Add to selection
        setSelectedNotes(prev => [...prev, clickedNote]);
      } else if (clickedNote) {
        // Check if resizing
        const noteEnd = timeToPixel(clickedNote.time + clickedNote.duration);
        if (Math.abs(x - noteEnd) < 5) {
          setDragState({
            type: 'resize',
            notes: selectedNotes.includes(clickedNote) ? selectedNotes : [clickedNote],
            trackIndex: selectedTrackIndex,
            startX: x
          });
        } else {
          // Start dragging
          if (!selectedNotes.includes(clickedNote)) {
            setSelectedNotes([clickedNote]);
          }
          setDragState({
            type: 'move',
            notes: selectedNotes.includes(clickedNote) ? selectedNotes : [clickedNote],
            trackIndex: selectedTrackIndex,
            startX: x,
            startY: y,
            originalPositions: (selectedNotes.includes(clickedNote) ? selectedNotes : [clickedNote]).map(n => ({
              time: n.time,
              note: n.note
            }))
          });
        }
      } else {
        // Start selection box or add new note
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
        } else {
          // Add new note
          const time = gridSnap(pixelToTime(x));
          const noteNum = pixelToNote(y);
          const duration = gridSnap(0.5);

          const newNote = {
            note: noteNum,
            time: time,
            duration: duration,
            velocity: 100
          };

          const newProject = { ...project };
          newProject.tracks[selectedTrackIndex].notes = [
            ...(newProject.tracks[selectedTrackIndex].notes || []),
            newNote
          ];
          
          onProjectUpdate(newProject);
          setSelectedNotes([newNote]);
          playNotePreview(noteNum);
          toast.success("Note added");
        }
      }
    }
  }, [project, selectedTrackIndex, getNoteAt, pixelToTime, pixelToNote, timeToPixel, gridSnap, onProjectUpdate, selectedNotes, playNotePreview]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update selection box
    if (selectionBox) {
      setSelectionBox(prev => ({ ...prev, endX: x, endY: y }));
      const notesInBox = getNotesInBox({ startX: selectionBox.startX, startY: selectionBox.startY, endX: x, endY: y });
      setSelectedNotes(notesInBox);
      return;
    }

    if (!dragState || !project) return;

    const newProject = { ...project };
    const track = newProject.tracks[dragState.trackIndex];

    if (dragState.type === 'move') {
      const deltaTime = pixelToTime(x) - pixelToTime(dragState.startX);
      const deltaNote = Math.round(pixelToNote(y) - pixelToNote(dragState.startY));

      dragState.notes.forEach((dragNote, idx) => {
        const noteIndex = track.notes.findIndex(n => n === dragNote);
        if (noteIndex !== -1) {
          const originalPos = dragState.originalPositions[idx];
          track.notes[noteIndex] = {
            ...dragNote,
            time: gridSnap(originalPos.time + deltaTime),
            note: Math.max(0, Math.min(127, originalPos.note + deltaNote))
          };
        }
      });
      
      onProjectUpdate(newProject);
    } else if (dragState.type === 'resize') {
      dragState.notes.forEach(dragNote => {
        const noteIndex = track.notes.findIndex(n => n === dragNote);
        if (noteIndex !== -1) {
          const newDuration = Math.max(0.125, gridSnap(pixelToTime(x) - dragNote.time));
          track.notes[noteIndex] = {
            ...dragNote,
            duration: newDuration
          };
        }
      });
      
      onProjectUpdate(newProject);
    }

    // Hover preview
    if (x < PIANO_WIDTH) {
      const noteNum = pixelToNote(y);
      setHoveredNote({ note: noteNum });
    } else {
      setHoveredNote(null);
    }
  }, [dragState, selectionBox, project, selectedTrackIndex, pixelToTime, pixelToNote, gridSnap, onProjectUpdate, getNotesInBox]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setSelectionBox(null);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!project) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedNotes.length > 0) {
        const newProject = { ...project };
        newProject.tracks[selectedTrackIndex].notes = newProject.tracks[selectedTrackIndex].notes?.filter(
          note => !selectedNotes.includes(note)
        );
        onProjectUpdate(newProject);
        setSelectedNotes([]);
        toast.success(`Deleted ${selectedNotes.length} notes`);
      }
    }

    // Select all
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      setSelectedNotes(project.tracks[selectedTrackIndex]?.notes || []);
      toast.success("All notes selected");
    }

    // Copy
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
      if (selectedNotes.length > 0) {
        setClipboard([...selectedNotes]);
        toast.success(`Copied ${selectedNotes.length} notes`);
      }
    }

    // Cut
    if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
      if (selectedNotes.length > 0) {
        setClipboard([...selectedNotes]);
        const newProject = { ...project };
        newProject.tracks[selectedTrackIndex].notes = newProject.tracks[selectedTrackIndex].notes?.filter(
          note => !selectedNotes.includes(note)
        );
        onProjectUpdate(newProject);
        setSelectedNotes([]);
        toast.success(`Cut ${clipboard.length} notes`);
      }
    }

    // Paste
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
      if (clipboard.length > 0 && project.tracks[selectedTrackIndex]) {
        const newProject = { ...project };
        const minTime = Math.min(...clipboard.map(n => n.time));
        const pastedNotes = clipboard.map(note => ({
          ...note,
          time: note.time - minTime + 0 // Paste at playhead or selection
        }));
        newProject.tracks[selectedTrackIndex].notes = [
          ...(newProject.tracks[selectedTrackIndex].notes || []),
          ...pastedNotes
        ];
        onProjectUpdate(newProject);
        setSelectedNotes(pastedNotes);
        toast.success(`Pasted ${clipboard.length} notes`);
      }
    }

    // Duplicate
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      if (selectedNotes.length > 0 && project.tracks[selectedTrackIndex]) {
        const newProject = { ...project };
        const duplicatedNotes = selectedNotes.map(note => ({
          ...note,
          time: note.time + 4
        }));
        newProject.tracks[selectedTrackIndex].notes = [
          ...(newProject.tracks[selectedTrackIndex].notes || []),
          ...duplicatedNotes
        ];
        onProjectUpdate(newProject);
        setSelectedNotes(duplicatedNotes);
        toast.success("Notes duplicated");
      }
    }

    // Arrow keys - transpose
    if (e.key === 'ArrowUp' && selectedNotes.length > 0) {
      e.preventDefault();
      const newProject = { ...project };
      const track = newProject.tracks[selectedTrackIndex];
      selectedNotes.forEach(selectedNote => {
        const idx = track.notes.findIndex(n => n === selectedNote);
        if (idx !== -1 && track.notes[idx].note < 127) {
          track.notes[idx] = { ...track.notes[idx], note: track.notes[idx].note + (e.shiftKey ? 12 : 1) };
        }
      });
      onProjectUpdate(newProject);
    }

    if (e.key === 'ArrowDown' && selectedNotes.length > 0) {
      e.preventDefault();
      const newProject = { ...project };
      const track = newProject.tracks[selectedTrackIndex];
      selectedNotes.forEach(selectedNote => {
        const idx = track.notes.findIndex(n => n === selectedNote);
        if (idx !== -1 && track.notes[idx].note > 0) {
          track.notes[idx] = { ...track.notes[idx], note: track.notes[idx].note - (e.shiftKey ? 12 : 1) };
        }
      });
      onProjectUpdate(newProject);
    }

    // Arrow keys - move in time
    if (e.key === 'ArrowRight' && selectedNotes.length > 0) {
      e.preventDefault();
      const newProject = { ...project };
      const track = newProject.tracks[selectedTrackIndex];
      const moveAmount = e.shiftKey ? 1 : 0.25;
      selectedNotes.forEach(selectedNote => {
        const idx = track.notes.findIndex(n => n === selectedNote);
        if (idx !== -1) {
          track.notes[idx] = { ...track.notes[idx], time: track.notes[idx].time + moveAmount };
        }
      });
      onProjectUpdate(newProject);
    }

    if (e.key === 'ArrowLeft' && selectedNotes.length > 0) {
      e.preventDefault();
      const newProject = { ...project };
      const track = newProject.tracks[selectedTrackIndex];
      const moveAmount = e.shiftKey ? 1 : 0.25;
      selectedNotes.forEach(selectedNote => {
        const idx = track.notes.findIndex(n => n === selectedNote);
        if (idx !== -1) {
          track.notes[idx] = { ...track.notes[idx], time: Math.max(0, track.notes[idx].time - moveAmount) };
        }
      });
      onProjectUpdate(newProject);
    }
  }, [project, selectedTrackIndex, selectedNotes, clipboard, onProjectUpdate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!project || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Clear
    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, width / 2, height / 2);

    // Draw piano keys
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, PIANO_WIDTH, height / 2);

    const blackKeys = [1, 3, 6, 8, 10];
    for (let i = 0; i < 88; i++) {
      const noteNum = i + 21;
      const y = noteToPixel(noteNum);
      const isBlack = blackKeys.includes(i % 12);
      const isHovered = hoveredNote && hoveredNote.note === noteNum;
      
      ctx.fillStyle = isHovered ? '#00D9FF' : (isBlack ? '#0A0A0B' : '#1C1C1F');
      ctx.fillRect(0, y, PIANO_WIDTH, NOTE_HEIGHT * zoom);
      
      ctx.strokeStyle = '#252529';
      ctx.strokeRect(0, y, PIANO_WIDTH, NOTE_HEIGHT * zoom);

      // Note names
      if (i % 12 === 0) {
        ctx.fillStyle = '#71717A';
        ctx.font = '8px monospace';
        ctx.fillText(`C${Math.floor(i / 12)}`, 5, y + NOTE_HEIGHT * zoom - 2);
      }
    }

    // Grid
    ctx.strokeStyle = '#1C1C1F';
    ctx.lineWidth = 1;

    const totalBeats = project.midi_data?.totalBeats || 64;
    for (let i = 0; i <= totalBeats; i++) {
      const x = timeToPixel(i);
      if (x >= PIANO_WIDTH && x <= width / 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height / 2);
        
        // Emphasize bar lines
        if (i % 4 === 0) {
          ctx.strokeStyle = '#252529';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#1C1C1F';
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        // Beat numbers
        if (i % 4 === 0) {
          ctx.fillStyle = '#52525B';
          ctx.font = '10px monospace';
          ctx.fillText(i.toString(), x + 2, 12);
        }
      }
    }

    for (let i = 0; i <= 127; i++) {
      const y = noteToPixel(i);
      if (y >= 0 && y <= height / 2) {
        ctx.strokeStyle = '#1C1C1F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PIANO_WIDTH, y);
        ctx.lineTo(width / 2, y);
        ctx.stroke();
      }
    }

    // Draw ghost notes from other tracks
    if (showGhostNotes) {
      project.tracks?.forEach((track, trackIndex) => {
        if (trackIndex === selectedTrackIndex || track.muted) return;
        
        const ghostColor = track.color || '#00D9FF';
        
        track.notes?.forEach(note => {
          const x = timeToPixel(note.time);
          const y = noteToPixel(note.note);
          const w = note.duration * BEAT_WIDTH * zoom;
          const h = NOTE_HEIGHT * zoom * 0.9;

          ctx.fillStyle = ghostColor;
          ctx.globalAlpha = 0.15;
          ctx.fillRect(x, y, w, h);
          
          ctx.strokeStyle = ghostColor;
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, w, h);
        });
      });
      ctx.globalAlpha = 1;
    }

    // Draw current track notes
    const currentTrack = project.tracks[selectedTrackIndex];
    if (currentTrack && !currentTrack.muted) {
      const color = currentTrack.color || '#00D9FF';
      
      currentTrack.notes?.forEach(note => {
        const x = timeToPixel(note.time);
        const y = noteToPixel(note.note);
        const w = note.duration * BEAT_WIDTH * zoom;
        const h = NOTE_HEIGHT * zoom * 0.9;

        const isSelected = selectedNotes.includes(note);
        const isHovered = hoveredNote === note;

        ctx.fillStyle = isSelected ? '#FFB800' : color;
        ctx.globalAlpha = isHovered ? 1 : 0.8;
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = isSelected ? '#FFFFFF' : color;
        ctx.globalAlpha = 1;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, w, h);

        // Velocity indicator
        const velocityHeight = (note.velocity / 127) * h;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x, y + h - velocityHeight, 3, velocityHeight);
      });
    }

    // Draw selection box
    if (selectionBox) {
      const boxX = Math.min(selectionBox.startX, selectionBox.endX);
      const boxY = Math.min(selectionBox.startY, selectionBox.endY);
      const boxW = Math.abs(selectionBox.endX - selectionBox.startX);
      const boxH = Math.abs(selectionBox.endY - selectionBox.startY);
      
      ctx.strokeStyle = '#00D9FF';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      
      ctx.fillStyle = 'rgba(0, 217, 255, 0.1)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);
    }

    // Playhead
    if (isPlaying) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const playheadX = timeToPixel(playheadPosition);
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height / 2);
      ctx.stroke();
    }

  }, [project, selectedTrackIndex, zoom, scroll, selectedNotes, hoveredNote, isPlaying, playheadPosition, showGhostNotes, selectionBox, noteToPixel, timeToPixel]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayheadPosition(0);
      return;
    }

    const interval = setInterval(() => {
      setPlayheadPosition(prev => {
        const totalBeats = project?.midi_data?.totalBeats || 64;
        if (prev >= totalBeats) return 0;
        return prev + 0.1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, project]);

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 bg-[#141416] border-b border-[#252529] flex items-center justify-between px-4">
        <h3 className="text-sm font-medium text-white">Enhanced Piano Roll</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`border-[#252529] hover:bg-[#252529] text-white ${
              snapToGrid ? 'bg-[#00D9FF] bg-opacity-20' : 'bg-[#1C1C1F]'
            }`}
          >
            <Grid3x3 className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGhostNotes(!showGhostNotes)}
            className={`border-[#252529] hover:bg-[#252529] text-white ${
              showGhostNotes ? 'bg-[#FFB800] bg-opacity-20' : 'bg-[#1C1C1F]'
            }`}
            title="Toggle ghost notes from other tracks"
          >
            {showGhostNotes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
          <div className="h-4 w-px bg-[#252529]" />
          <Button
            variant="outline"
            size="sm"
            disabled={selectedNotes.length === 0}
            onClick={() => {
              setClipboard([...selectedNotes]);
              toast.success("Copied");
            }}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#252529] text-white"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedNotes.length === 0}
            onClick={() => {
              if (!project) return;
              const newProject = { ...project };
              newProject.tracks[selectedTrackIndex].notes = newProject.tracks[selectedTrackIndex].notes?.filter(
                note => !selectedNotes.includes(note)
              );
              onProjectUpdate(newProject);
              setSelectedNotes([]);
              toast.success("Deleted");
            }}
            className="bg-[#1C1C1F] border-[#252529] hover:bg-[#EF4444] text-white"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto"
        onWheel={(e) => {
          if (e.shiftKey) {
            setScroll(s => ({ ...s, x: Math.max(0, s.x + e.deltaY) }));
          } else {
            setScroll(s => ({ ...s, y: Math.max(0, s.y + e.deltaY) }));
          }
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="h-10 bg-[#141416] border-t border-[#252529] flex items-center px-4 text-xs text-[#A1A1AA]">
        <span className="mr-4">Zoom: {Math.round(zoom * 100)}%</span>
        <span className="mr-4">Selected: {selectedNotes.length}</span>
        <span className="mr-4">Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
        <span className="mr-4">Ghost Notes: {showGhostNotes ? 'ON' : 'OFF'}</span>
        <div className="flex-1" />
        <span className="text-[#71717A]">
          Shift+Drag: Multi-select • Click piano: Preview • ↑↓←→: Move • Shift+↑↓: Octave • Cmd+A: Select all
        </span>
      </div>
    </div>
  );
}