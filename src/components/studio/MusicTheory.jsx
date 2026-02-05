// Music theory utilities for better generation

export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  minor_harmonic: [0, 2, 3, 5, 7, 8, 11],
  minor_melodic: [0, 2, 3, 5, 7, 9, 11],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10]
};

export const CHORD_PROGRESSIONS = {
  trap_soul: [
    ['vi', 'IV', 'I', 'V'],
    ['i', 'VI', 'III', 'VII'],
    ['i', 'iv', 'VII', 'VI']
  ],
  rnb: [
    ['I', 'V', 'vi', 'IV'],
    ['ii', 'V', 'I', 'vi'],
    ['I', 'vi', 'IV', 'V']
  ],
  lofi: [
    ['ii', 'V', 'I', 'vi'],
    ['iii', 'vi', 'ii', 'V'],
    ['I', 'iii', 'IV', 'iv']
  ],
  afrobeats: [
    ['I', 'V', 'vi', 'IV'],
    ['vi', 'IV', 'I', 'V'],
    ['i', 'VII', 'VI', 'V']
  ],
  hip_hop: [
    ['i', 'VI', 'III', 'VII'],
    ['i', 'iv', 'i', 'v'],
    ['vi', 'IV', 'I', 'V']
  ],
  jazz: [
    ['ii', 'V', 'I', 'VI'],
    ['iii', 'VI', 'ii', 'V'],
    ['I', 'VI', 'ii', 'V']
  ]
};

export const GROOVE_TEMPLATES = {
  trap_soul: {
    drums: {
      hihat_pattern: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75],
      kick_pattern: [0, 1, 2.5, 3],
      snare_pattern: [1, 3],
      swing: 0.15
    }
  },
  rnb: {
    drums: {
      hihat_pattern: [0, 0.5, 1, 1.5],
      kick_pattern: [0, 2],
      snare_pattern: [1, 3],
      swing: 0.1
    }
  },
  lofi: {
    drums: {
      hihat_pattern: [0, 0.333, 0.666, 1, 1.333, 1.666],
      kick_pattern: [0, 2.5],
      snare_pattern: [1, 3],
      swing: 0.2
    }
  },
  afrobeats: {
    drums: {
      hihat_pattern: [0, 0.5, 1, 1.25, 1.5, 2, 2.5, 3, 3.25, 3.5],
      kick_pattern: [0, 1, 2, 3],
      snare_pattern: [1, 3],
      swing: 0.05
    }
  }
};

export function getScaleNotes(rootNote, scale = 'major') {
  const scaleIntervals = SCALES[scale] || SCALES.major;
  return scaleIntervals.map(interval => rootNote + interval);
}

export function quantizeToScale(note, rootNote, scale = 'major') {
  const scaleNotes = getScaleNotes(rootNote, scale);
  const octave = Math.floor(note / 12) * 12;
  const noteInOctave = note % 12;
  
  // Find closest scale note
  let closest = scaleNotes[0];
  let minDist = Math.abs(noteInOctave - closest);
  
  for (const scaleNote of scaleNotes) {
    const dist = Math.abs(noteInOctave - scaleNote);
    if (dist < minDist) {
      minDist = dist;
      closest = scaleNote;
    }
  }
  
  return octave + closest;
}

export function noteToName(midiNote) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = notes[midiNote % 12];
  return `${noteName}${octave}`;
}

export function nameToNote(noteName) {
  const notes = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
  const match = noteName.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60;
  const [, note, octave] = match;
  return (parseInt(octave) + 1) * 12 + notes[note];
}

export function humanizeNotes(notes, amount = 0.5) {
  return notes.map(note => ({
    ...note,
    time: note.time + (Math.random() - 0.5) * 0.05 * amount,
    velocity: Math.max(20, Math.min(127, note.velocity + (Math.random() - 0.5) * 20 * amount)),
    duration: note.duration * (1 + (Math.random() - 0.5) * 0.1 * amount)
  }));
}

export function applySwing(notes, swingAmount = 0.5) {
  return notes.map(note => {
    const beatPosition = note.time % 1;
    if (beatPosition >= 0.4 && beatPosition <= 0.6) {
      return {
        ...note,
        time: note.time + swingAmount * 0.125
      };
    }
    return note;
  });
}