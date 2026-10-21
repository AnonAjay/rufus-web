import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  audioLevel: number;
  waveformBars: number[];
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
}

export interface UseAudioRecorderOptions {
  autoStopOnSilence?: boolean;
  silenceThresholdMs?: number;
  onAutoStop?: (blob: Blob) => void;
}

export const useAudioRecorder = (options: UseAudioRecorderOptions = {}): AudioRecorderState => {
  const { autoStopOnSilence = false, silenceThresholdMs = 1200, onAutoStop } = options;

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(0.12));
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);

  // Web Audio Analyser references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const hasSpokenRef = useRef<boolean>(false);

  // Cleanup helper
  const cleanupAudioGraph = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
    setWaveformBars(Array(24).fill(0.12));
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudioGraph();
    };
  }, [cleanupAudioGraph]);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];
    startTimeRef.current = Date.now();
    hasSpokenRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Set up Web Audio Analyser for live visualizer & VAD
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Container mime-type selection
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      let selectedMime = "";
      for (const candidate of candidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          selectedMime = candidate;
          break;
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start();
      setIsRecording(true);

      // Start live waveform & RMS calculation loop
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);

      const processAudioFrame = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(frequencyData);
        analyserRef.current.getByteTimeDomainData(timeData);

        // Calculate RMS Energy
        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const normalized = (timeData[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / timeData.length);
        setAudioLevel(Math.min(1, rms * 3.5));

        // Sample 24 distinct frequency bands across human speech range (100Hz - ~5500Hz)
        const numBars = 24;
        const totalBins = analyserRef.current.frequencyBinCount; // 64
        const maxBin = Math.min(totalBins - 1, 48);
        const bars: number[] = [];

        for (let i = 0; i < numBars; i++) {
          const binIndex = 1 + Math.floor((i * (maxBin - 1)) / (numBars - 1));
          const val = frequencyData[binIndex] || 0;
          // Scale dynamically with audio sensitivity
          const normalized = Math.max(0.12, Math.min(1.0, val / 185));
          bars.push(normalized);
        }
        setWaveformBars(bars);

        // VAD (Voice Activity Detection): Silence threshold
        if (rms > 0.06) {
          hasSpokenRef.current = true;
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (hasSpokenRef.current && autoStopOnSilence) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = window.setTimeout(async () => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                const blob = await stopRecording();
                if (blob && onAutoStop) {
                  onAutoStop(blob);
                }
              }
            }, silenceThresholdMs);
          }
        }

        animationFrameRef.current = requestAnimationFrame(processAudioFrame);
      };

      animationFrameRef.current = requestAnimationFrame(processAudioFrame);
    } catch (err: any) {
      const msg = err?.message || "Microphone access denied.";
      setError(msg);
      setIsRecording(false);
      cleanupAudioGraph();
    }
  }, [autoStopOnSilence, silenceThresholdMs, onAutoStop, cleanupAudioGraph]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      const duration = Date.now() - startTimeRef.current;

      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        cleanupAudioGraph();
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        cleanupAudioGraph();
        setIsRecording(false);

        // Guard against micro-taps (< 350ms or empty payload)
        if (duration < 350 || blob.size < 1000) {
          setError("Hold the mic button while speaking.");
          resolve(null);
          return;
        }

        resolve(blob);
      };

      recorder.stop();
    });
  }, [cleanupAudioGraph]);

  return {
    isRecording,
    audioLevel,
    waveformBars,
    error,
    startRecording,
    stopRecording,
  };
};
