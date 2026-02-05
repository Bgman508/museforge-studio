
class AudioExporter {
  constructor() {
    this.offlineContext = null;
  }

  async exportToWAV(project, options = {}) {
    const { sampleRate = 44100, duration } = options;
    
    const totalBeats = project.midi_data?.totalBeats || 32;
    const tempo = project.tempo || 120;
    const secondsPerBeat = 60 / tempo;
    const totalDuration = duration || (totalBeats * secondsPerBeat);
    
    const offlineContext = new OfflineAudioContext(
      2,
      sampleRate * totalDuration,
      sampleRate
    );

    const masterGain = offlineContext.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(offlineContext.destination);

    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.connect(masterGain);

    project.tracks?.forEach(track => {
      if (track.muted) return;

      const trackGain = offlineContext.createGain();
      trackGain.gain.value = (track.volume || 0.8) * 0.3;
      
      const panner = offlineContext.createStereoPanner();
      panner.pan.value = track.pan || 0;
      
      trackGain.connect(panner);
      panner.connect(compressor);

      track.notes?.forEach(note => {
        const startTime = note.time * secondsPerBeat;
        const noteDuration = note.duration * secondsPerBeat;
        const frequency = 440 * Math.pow(2, (note.note - 69) / 12);
        const velocity = (note.velocity || 100) / 127;

        this.createOfflineSynth(
          offlineContext,
          track.instrument,
          frequency,
          startTime,
          noteDuration,
          velocity,
          trackGain
        );
      });
    });

    const renderedBuffer = await offlineContext.startRendering();
    
    const wavBuffer = this.audioBufferToWav(renderedBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  createOfflineSynth(context, instrumentType, frequency, startTime, duration, velocity, destination) {
    const endTime = startTime + duration;
    const volume = velocity * 0.3;

    switch(instrumentType?.toLowerCase()) {
      case 'melody':
      case 'lead':
        this.createOfflineLeadSynth(context, frequency, startTime, endTime, volume, destination);
        break;
      case 'chords':
      case 'harmony':
      case 'pad':
        this.createOfflinePadSynth(context, frequency, startTime, endTime, volume, destination);
        break;
      case 'bass':
        this.createOfflineBassSynth(context, frequency, startTime, endTime, volume, destination);
        break;
      case 'drums':
        this.createOfflineDrumSound(context, frequency, startTime, volume, destination);
        break;
      default:
        this.createOfflineLeadSynth(context, frequency, startTime, endTime, volume, destination);
    }
  }

  createOfflineLeadSynth(context, frequency, startTime, endTime, volume, destination) {
    const osc = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, startTime);
    filter.Q.value = 1;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, endTime - 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime);
    osc.stop(endTime);
  }

  createOfflinePadSynth(context, frequency, startTime, endTime, volume, destination) {
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, startTime);
    osc2.frequency.setValueAtTime(frequency * 1.01, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.6, startTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(endTime);
    osc2.stop(endTime);
  }

  createOfflineBassSynth(context, frequency, startTime, endTime, volume, destination) {
    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 1.2, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime);
    osc.stop(endTime);
  }

  createOfflineDrumSound(context, frequency, startTime, volume, destination) {
    if (frequency < 100) {
      this.createOfflineKick(context, startTime, volume, destination);
    } else if (frequency < 200) {
      this.createOfflineSnare(context, startTime, volume, destination);
    } else {
      this.createOfflineHiHat(context, startTime, volume, destination);
    }
  }

  createOfflineKick(context, startTime, volume, destination) {
    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);

    gainNode.gain.setValueAtTime(volume * 2, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  }

  createOfflineSnare(context, startTime, volume, destination) {
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(volume * 1.5, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    noise.connect(gainNode);
    gainNode.connect(destination);

    noise.start(startTime);
  }

  createOfflineHiHat(context, startTime, volume, destination) {
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.05, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

    noise.connect(gainNode);
    gainNode.connect(destination);

    noise.start(startTime);
  }

  audioBufferToWav(buffer) {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  async exportStems(project) {
    const stems = {};
    
    for (const track of project.tracks) {
      if (track.muted) continue;
      
      const stemProject = {
        ...project,
        tracks: [track]
      };
      
      const wavBlob = await this.exportToWAV(stemProject);
      stems[track.name] = wavBlob;
    }
    
    return stems;
  }
}

export const audioExporter = new AudioExporter();