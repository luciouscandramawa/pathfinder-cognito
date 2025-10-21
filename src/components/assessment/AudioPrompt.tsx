import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Circle, Square, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { hfSentiment, hfWhisperTranscribe } from "@/integrations/ai/hf";

interface Props {
  question: string;
  onComplete: (audioData: any) => void;
  icon?: React.ReactNode;
}

const AudioPrompt = ({ question, onComplete, icon }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [timeLeft, setTimeLeft] = useState(75);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        setRecordedBlob(blob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      toast.error("Failed to access microphone");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      toast.success("Recording stopped");
    }
  };

  const handleSubmit = async () => {
    if (!recordedBlob) {
      onComplete({
        audioUrl: recordedAudio,
        duration: recordingTime,
        timestamp: Date.now(),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      toast.message("Analyzing your response...");
      const transcript = await hfWhisperTranscribe(recordedBlob);
      let sentiment = null as any;
      if (transcript && transcript.trim().length > 0) {
        sentiment = await hfSentiment(transcript);
      }
      onComplete({
        audioUrl: recordedAudio,
        duration: recordingTime,
        timestamp: Date.now(),
        transcript: transcript || null,
        sentiment: sentiment || null,
      });
    } catch (e) {
      onComplete({
        audioUrl: recordedAudio,
        duration: recordingTime,
        timestamp: Date.now(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    setTimeLeft(75);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (recordedBlob && !isSubmitting) {
            handleSubmit();
          } else if (isRecording) {
            stopRecording();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            {icon || <Mic className="w-6 h-6 text-primary" />}
            {question}
          </CardTitle>
          <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-destructive' : 'text-primary'}`}>
            ⏱️ {timeLeft}s
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Record a 30-60 second audio response. Speak clearly and share your thoughts.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center gap-4 min-h-[200px]">
          {!isRecording && !recordedAudio && (
            <div className="flex flex-col items-center gap-3">
              <Mic className="w-16 h-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ready to record</p>
            </div>
          )}
          
          {isRecording && (
            <div className="flex flex-col items-center gap-3 animate-pulse">
              <Circle className="w-16 h-16 text-destructive fill-current" />
              <div className="text-2xl font-medium">{formatTime(recordingTime)}</div>
              <p className="text-sm text-muted-foreground">Recording in progress...</p>
            </div>
          )}

          {recordedAudio && !isRecording && (
            <div className="flex flex-col items-center gap-3 w-full">
              <Mic className="w-16 h-16 text-primary" />
              <audio
                ref={audioRef}
                src={recordedAudio}
                controls
                className="w-full max-w-md"
              />
              <p className="text-sm text-muted-foreground">Duration: {formatTime(recordingTime)}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!recordedAudio && !isRecording && (
            <Button
              onClick={startRecording}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              <Mic className="mr-2 w-4 h-4" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="flex-1"
            >
              <Square className="mr-2 w-4 h-4" />
              Stop Recording
            </Button>
          )}

          {recordedAudio && !isRecording && (
            <>
              <Button
                onClick={() => {
                  setRecordedAudio(null);
                  setRecordedBlob(null);
                  setRecordingTime(0);
                }}
                variant="outline"
                className="flex-1"
              >
                Re-record
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-primary hover:opacity-90 disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Analyzing..." : "Submit Response"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioPrompt;
