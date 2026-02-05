class AudioEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.scheduledNotes = [];
  }

  async init() {
    if (!this.context) {
      try {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.7;
        this.masterGain.connect(this.context.destination);
        console.log('🔊 Audio Engine initialized');
      } catch (e) {
        console.error('Failed to initialize audio:', e);
      }
    }
    
    // Resume context if suspended (required for browser autoplay policies)
    if (this.context.state === 'suspended') {
      await this.context.resume();
      console.log('🔊 Audio context resumed');
    }
  }

  midiToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  createSynth(type, frequency, time, duration, velocity, trackVolume) {
    const now = this.context.currentTime;
    const startTime = now + time;
    const endTime = startTime + duration;
    const volume = (velocity / 127) * trackVolume * 0.5;

    console.log(`🎵 Creating synth: ${type}, freq: ${frequency.toFixed(2)}Hz, vol: ${volume.toFixed(2)}`);

    switch(type?.toLowerCase()) {
      case 'melody':
      case 'lead':
        return this.createLeadSynth(frequency, startTime, endTime, volume);
      case 'chords':
      case 'harmony':
      case 'pad':
        return this.createPadSynth(frequency, startTime, endTime, volume);
      case 'bass':
        return this.createBassSynth(frequency, startTime, endTime, volume);
      case 'drums':
        return this.createDrumSound(frequency, startTime, volume);
      default:
        return this.createLeadSynth(frequency, startTime, endTime, volume);
    }
  }

  createLeadSynth(frequency, startTime, endTime, volume) {
    const osc = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    filter.Q.value = 1;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, Math.max(startTime + 0.1, endTime - 0.1));
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(endTime);

    return { osc, gainNode };
  }

  createPadSynth(frequency, startTime, endTime, volume) {
    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, startTime);
    osc2.frequency.setValueAtTime(frequency * 1.01, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.Q.value = 1;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, Math.max(startTime + 0.2, endTime - 0.2));
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(endTime);
    osc2.stop(endTime);

    return { osc1, osc2, gainNode };
  }

  createBassSynth(frequency, startTime, endTime, volume) {
    const osc = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, startTime);
    filter.Q.value = 5;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 1.2, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.8, Math.max(startTime + 0.05, endTime - 0.05));
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(endTime);

    return { osc, gainNode };
  }

  createDrumSound(frequency, startTime, volume) {
    if (frequency < 100) {
      return this.createKick(startTime, volume);
    } else if (frequency < 200) {
      return this.createSnare(startTime, volume);
    } else {
      return this.createHiHat(startTime, volume);
    }
  }

  createKick(startTime, volume) {
    const osc = this.context.createOscillator();
    const gainNode = this.context.createGain();

    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);

    gainNode.gain.setValueAtTime(volume * 2, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.5);

    return { osc, gainNode };
  }

  createSnare(startTime, volume) {
    const noise = this.context.createBufferSource();
    const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.2, this.context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = noiseBuffer;

    const noiseGain = this.context.createGain();
    const noiseFilter = this.context.createBiquadFilter();
    
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    noiseGain.gain.setValueAtTime(volume * 1.5, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(startTime);
    
    return { noise, noiseGain };
  }

  createHiHat(startTime, volume) {
    const noise = this.context.createBufferSource();
    const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.05, this.context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = noiseBuffer;

    const noiseGain = this.context.createGain();
    const noiseFilter = this.context.createBiquadFilter();
    
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 7000;

    noiseGain.gain.setValueAtTime(volume, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(startTime);
    
    return { noise, noiseGain };
  }

  async play(project, options = {}) {
    console.log('🎵 PLAY called with project:', project);
    
    await this.init();
    this.stop();

    if (!project || !project.tracks) {
      console.error('❌ No project or tracks');
      return;
    }

    console.log('🎵 Playing project:', project.name);
    console.log('🎵 Tracks:', project.tracks.length);
    console.log('🎵 Tempo:', project.tempo);

    this.isPlaying = true;
    
    const tempo = project.tempo || 120;
    const secondsPerBeat = 60 / tempo;
    const startBeat = options.startTime || 0;
    const endBeat = options.endTime || null;

    let totalNotesScheduled = 0;

    project.tracks.forEach((track, trackIndex) => {
      if (track.muted) {
        console.log(`⏭️ Skipping muted track: ${track.name}`);
        return;
      }

      const trackVolume = track.volume || 0.8;
      const instrumentType = track.instrument?.toLowerCase() || track.name?.toLowerCase() || 'melody';

      console.log(`🎹 Track ${trackIndex}: ${track.name} (${instrumentType}), ${track.notes?.length || 0} notes, vol: ${trackVolume}`);

      track.notes?.forEach(note => {
        if (startBeat && note.time < startBeat) return;
        if (endBeat && note.time >= endBeat) return;

        const time = (note.time - startBeat) * secondsPerBeat;
        const duration = note.duration * secondsPerBeat;
        const frequency = this.midiToFrequency(note.note);
        
        try {
          const synth = this.createSynth(
            instrumentType,
            frequency,
            time,
            duration,
            note.velocity || 100,
            trackVolume
          );
          this.scheduledNotes.push(synth);
          totalNotesScheduled++;
        } catch (e) {
          console.error('❌ Error creating synth:', e);
        }
      });
    });

    console.log(`✅ Scheduled ${totalNotesScheduled} notes`);

    // Auto-stop
    if (!options.loop) {
      const totalBeats = endBeat || project.midi_data?.totalBeats || 32;
      const duration = (totalBeats - startBeat) * secondsPerBeat * 1000;
      setTimeout(() => {
        console.log('⏹️ Auto-stopping');
        this.stop();
      }, duration + 500);
    }
  }

  stop() {
    console.log('⏹️ STOP called');
    this.isPlaying = false;
    
    this.scheduledNotes.forEach(noteObj => {
      try {
        Object.values(noteObj).forEach(node => {
          if (node && typeof node.stop === 'function') {
            try {
              node.stop();
            } catch (e) {
              // Already stopped
            }
          }
          if (node && typeof node.disconnect === 'function') {
            try {
              node.disconnect();
            } catch (e) {
              // Already disconnected
            }
          }
        });
      } catch (e) {
        console.error('Error stopping note:', e);
      }
    });
    
    this.scheduledNotes = [];
    console.log('✅ All notes stopped');
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }
}

export const audioEngine = new AudioEngine();