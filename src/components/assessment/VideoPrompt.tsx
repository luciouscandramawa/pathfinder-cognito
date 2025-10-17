import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Circle, Square, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Props {
  question: string;
  onComplete: (videoData: any) => void;
  icon?: React.ReactNode;
}

const VideoPrompt = ({ question, onComplete, icon }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);

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
      toast.error("Failed to access camera/microphone");
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

  const handleSubmit = () => {
    onComplete({
      videoUrl: recordedVideo,
      duration: recordingTime,
      timestamp: Date.now(),
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          {icon || <Camera className="w-6 h-6 text-primary" />}
          {question}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Record a 30-60 second video response. Speak clearly and share your thoughts.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            muted={!recordedVideo}
            src={recordedVideo || undefined}
            className="w-full h-full object-cover"
          />
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-destructive text-white px-3 py-1 rounded-full animate-pulse">
              <Circle className="w-3 h-3 fill-current" />
              <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!recordedVideo && !isRecording && (
            <Button
              onClick={startRecording}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              <Camera className="mr-2 w-4 h-4" />
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

          {recordedVideo && !isRecording && (
            <>
              <Button
                onClick={() => {
                  setRecordedVideo(null);
                  setRecordingTime(0);
                }}
                variant="outline"
                className="flex-1"
              >
                Re-record
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                Submit Response
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPrompt;
