import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Camera, Mic, Shield, Sparkles, Target } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();
  const [cameraConsent, setCameraConsent] = useState(false);
  const [micConsent, setMicConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const canStart = cameraConsent && micConsent && privacyConsent;

  const handleBegin = () => {
    if (canStart) {
      navigate("/assessment");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary shadow-elevated mb-4 animate-pulse-slow">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Discover Your Path
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            An adaptive assessment combining interactive questions, creative tasks, and 
            cognitive challenges to reveal your ideal academic majors and career paths.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 my-8">
          <Card className="border-primary/20 shadow-card hover:shadow-elevated transition-all duration-300">
            <CardContent className="p-6 space-y-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Adaptive Testing</h3>
              <p className="text-sm text-muted-foreground">
                Questions adjust to your responses for accurate results
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 shadow-card hover:shadow-elevated transition-all duration-300">
            <CardContent className="p-6 space-y-2">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg">Creative Challenges</h3>
              <p className="text-sm text-muted-foreground">
                Express yourself through video and written responses
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 shadow-card hover:shadow-elevated transition-all duration-300">
            <CardContent className="p-6 space-y-2">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">Cognitive Games</h3>
              <p className="text-sm text-muted-foreground">
                Fun mini-games measure focus and reaction time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Consent Section */}
        <Card className="shadow-elevated">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Privacy & Device Setup
              </h2>
              <p className="text-muted-foreground">
                This assessment includes video responses and cognitive games. We need your permission to access your camera and microphone. Your data is encrypted and used only for assessment purposes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Checkbox
                  id="camera"
                  checked={cameraConsent}
                  onCheckedChange={(checked) => setCameraConsent(checked as boolean)}
                  className="mt-1"
                />
                <div className="space-y-1 flex-1">
                  <label
                    htmlFor="camera"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    Camera Access
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Required for video response questions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Checkbox
                  id="microphone"
                  checked={micConsent}
                  onCheckedChange={(checked) => setMicConsent(checked as boolean)}
                  className="mt-1"
                />
                <div className="space-y-1 flex-1">
                  <label
                    htmlFor="microphone"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4 text-secondary" />
                    Microphone Access
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Required for verbal reasoning scenarios
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Checkbox
                  id="privacy"
                  checked={privacyConsent}
                  onCheckedChange={(checked) => setPrivacyConsent(checked as boolean)}
                  className="mt-1"
                />
                <div className="space-y-1 flex-1">
                  <label
                    htmlFor="privacy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-accent" />
                    Privacy Policy
                  </label>
                  <p className="text-sm text-muted-foreground">
                    I understand my data will be encrypted and used solely for assessment purposes
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleBegin}
                disabled={!canStart}
                className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                Begin Assessment
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ⏱️ Estimated time: 15-20 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Welcome;
