import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Grid3x3, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

const NOTE_HEIGHT = 12;
const BEAT_WIDTH = 60;
const PIANO_WIDTH = 60;

export default function InteractivePianoRoll({ project, onProjectUpdate, isPlaying }) {
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

  const handleMouseDown = useCallback((e) => {
    if (!project) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on piano keys (for playback preview)
    if (x < PIANO_WIDTH) {
      return;
    }

    const clickedTrackIndex = 0; // For now, edit first track
    const clickedNote = getNoteAt(x, y, clickedTrackIndex);

    if (e.button === 0) { // Left click
      if (clickedNote) {
        // Check if resizing (right edge of note)
        const noteEnd = timeToPixel(clickedNote.time + clickedNote.duration);
        if (Math.abs(x - noteEnd) < 5) {
          setDragState({
            type: 'resize',
            note: clickedNote,
            trackIndex: clickedTrackIndex,
            startX: x
          });
        } else {
          // Start dragging note
          setDragState({
            type: 'move',
            note: clickedNote,
            trackIndex: clickedTrackIndex,
            startX: x,
            startY: y,
            originalTime: clickedNote.time,
            originalNote: clickedNote.note
          });
          setSelectedNotes([clickedNote]);
        }
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
        newProject.tracks[clickedTrackIndex].notes = [
          ...(newProject.tracks[clickedTrackIndex].notes || []),
          newNote
        ];
        
        onProjectUpdate(newProject);
        setSelectedNotes([newNote]);
        toast.success("Note added");
      }
    }
  }, [project, getNoteAt, pixelToTime, pixelToNote, timeToPixel, gridSnap, onProjectUpdate]);

  const handleMouseMove = useCallback((e) => {
    if (!dragState || !project) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newProject = { ...project };
    const track = newProject.tracks[dragState.trackIndex];

    if (dragState.type === 'move') {
      const deltaTime = pixelToTime(x) - pixelToTime(dragState.startX);
      const deltaNote = pixelToNote(y) - pixelToNote(dragState.startY);

      const noteIndex = track.notes.findIndex(n => n === dragState.note);
      if (noteIndex !== -1) {
        track.notes[noteIndex] = {
          ...dragState.note,
          time: gridSnap(dragState.originalTime + deltaTime),
          note: Math.max(0, Math.min(127, dragState.originalNote + Math.round(deltaNote)))
        };
        onProjectUpdate(newProject);
      }
    } else if (dragState.type === 'resize') {
      const newDuration = Math.max(0.125, gridSnap(pixelToTime(x) - dragState.note.time));
      const noteIndex = track.notes.findIndex(n => n === dragState.note);
      if (noteIndex !== -1) {
        track.notes[noteIndex] = {
          ...dragState.note,
          duration: newDuration
        };
        onProjectUpdate(newProject);
      }
    }
  }, [dragState, project, pixelToTime, pixelToNote, gridSnap, onProjectUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!project) return;

    // Delete selected notes
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedNotes.length > 0) {
        const newProject = { ...project };
        newProject.tracks.forEach(track => {
          track.notes = track.notes?.filter(note => !selectedNotes.includes(note));
        });
        onProjectUpdate(newProject);
        setSelectedNotes([]);
        toast.success("Notes deleted");
      }
    }

    // Copy
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
      if (selectedNotes.length > 0) {
        setClipboard([...selectedNotes]);
        toast.success(`Copied ${selectedNotes.length} notes`);
      }
    }

    // Paste
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
      if (clipboard.length > 0 && project.tracks[0]) {
        const newProject = { ...project };
        const pastedNotes = clipboard.map(note => ({
          ...note,
          time: note.time + 4 // Paste 4 beats later
        }));
        newProject.tracks[0].notes = [
          ...(newProject.tracks[0].notes || []),
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
      if (selectedNotes.length > 0 && project.tracks[0]) {
        const newProject = { ...project };
        const duplicatedNotes = selectedNotes.map(note => ({
          ...note,
          time: note.time + 4
        }));
        newProject.tracks[0].notes = [
          ...(newProject.tracks[0].notes || []),
          ...duplicatedNotes
        ];
        onProjectUpdate(newProject);
        setSelectedNotes(duplicatedNotes);
        toast.success("Notes duplicated");
      }
    }
  }, [project, selectedNotes, clipboard, onProjectUpdate]);

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
      const y = noteToPixel(i + 21);
      const isBlack = blackKeys.includes(i % 12);
      
      ctx.fillStyle = isBlack ? '#0A0A0B' : '#1C1C1F';
      ctx.fillRect(0, y, PIANO_WIDTH, NOTE_HEIGHT * zoom);
      
      ctx.strokeStyle = '#252529';
      ctx.strokeRect(0, y, PIANO_WIDTH, NOTE_HEIGHT * zoom);

      // Draw note name for C notes
      if (i % 12 === 0) {
        ctx.fillStyle = '#71717A';
        ctx.font = '8px monospace';
        ctx.fillText(`C${Math.floor(i / 12)}`, 5, y + NOTE_HEIGHT * zoom - 2);
      }
    }

    // Draw grid
    ctx.strokeStyle = '#1C1C1F';
    ctx.lineWidth = 1;

    const totalBeats = project.midi_data?.totalBeats || 64;
    for (let i = 0; i <= totalBeats; i++) {
      const x = timeToPixel(i);
      if (x >= PIANO_WIDTH && x <= width / 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height / 2);
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
        ctx.beginPath();
        ctx.moveTo(PIANO_WIDTH, y);
        ctx.lineTo(width / 2, y);
        ctx.stroke();
      }
    }

    // Draw notes
    project.tracks?.forEach((track, trackIndex) => {
      if (track.muted) return;
      
      const color = track.color || '#00D9FF';
      
      track.notes?.forEach(note => {
        const x = timeToPixel(note.time);
        const y = noteToPixel(note.note);
        const w = note.duration * BEAT_WIDTH * zoom;
        const h = NOTE_HEIGHT * zoom * 0.9;

        const isSelected = selectedNotes.includes(note);
        const isHovered = hoveredNote === note;

        ctx.fillStyle = isSelected ? '#FFB800' : color;
        ctx.globalAlpha = track.muted ? 0.2 : (isHovered ? 1 : 0.8);
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
    });

    // Draw playhead
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

  }, [project, zoom, scroll, selectedNotes, hoveredNote, isPlaying, playheadPosition, noteToPixel, timeToPixel]);

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
        <h3 className="text-sm font-medium text-white">Interactive Piano Roll</h3>
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
              newProject.tracks.forEach(track => {
                track.notes = track.notes?.filter(note => !selectedNotes.includes(note));
              });
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

      <div className="h-8 bg-[#141416] border-t border-[#252529] flex items-center px-4 text-xs text-[#A1A1AA]">
        <span className="mr-4">Zoom: {Math.round(zoom * 100)}%</span>
        <span className="mr-4">Selected: {selectedNotes.length}</span>
        <span className="mr-4">Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
        <span className="text-[#71717A]">
          Tip: Click to add notes • Drag to move • Right edge to resize • Del to delete • Cmd+C/V to copy/paste
        </span>
      </div>
    </div>
  );
}