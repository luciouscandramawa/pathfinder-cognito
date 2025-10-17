import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Circle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onComplete: (score: number) => void;
}

const CognitiveGame = ({ onComplete }: Props) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [showTarget, setShowTarget] = useState(false);
  const [isGreen, setIsGreen] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [targetTime, setTargetTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  const maxAttempts = 15;

  useEffect(() => {
    if (!gameActive || attempts >= maxAttempts) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, attempts]);

  const showNextTarget = useCallback(() => {
    if (attempts >= maxAttempts) {
      endGame();
      return;
    }

    // Random delay between 1-3 seconds
    const delay = Math.random() * 2000 + 1000;

    setTimeout(() => {
      const isTargetGreen = Math.random() > 0.3; // 70% green, 30% red
      setIsGreen(isTargetGreen);
      setShowTarget(true);
      setTargetTime(Date.now());
      setAttempts((prev) => prev + 1);

      // Auto-hide after 2 seconds if no response
      setTimeout(() => {
        if (showTarget) {
          setShowTarget(false);
          showNextTarget();
        }
      }, 2000);
    }, delay);
  }, [attempts, showTarget]);

  const startGame = () => {
    setGameStarted(true);
    setGameActive(true);
    setScore(0);
    setAttempts(0);
    setReactionTimes([]);
    setTimeLeft(120);
    toast.success("Focus! Press space when you see a green circle");
    showNextTarget();
  };

  const endGame = () => {
    setGameActive(false);
    setShowTarget(false);
    const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const finalScore = Math.round((score / maxAttempts) * 100);
    toast.success(`Game complete! Final score: ${finalScore}`);
    setTimeout(() => onComplete(finalScore), 1500);
  };

  const handleResponse = useCallback(() => {
    if (!showTarget || !gameActive) return;

    const reactionTime = Date.now() - targetTime;

    if (isGreen) {
      setScore((prev) => prev + 1);
      setReactionTimes((prev) => [...prev, reactionTime]);
      toast.success(`Great! ${reactionTime}ms`);
    } else {
      toast.error("That was red! Wait for green");
    }

    setShowTarget(false);
    showNextTarget();
  }, [showTarget, isGreen, targetTime, gameActive, showNextTarget]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && gameActive) {
        e.preventDefault();
        handleResponse();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleResponse, gameActive]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
          <Zap className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Cognitive Mini-Game</h2>
          <p className="text-muted-foreground">Focus & Reaction Time Test</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">Focus Challenge</CardTitle>
          <p className="text-sm text-muted-foreground">
            Press SPACEBAR when you see a GREEN circle. Ignore red circles!
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!gameStarted ? (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center gap-4 mb-6">
                <div className="flex flex-col items-center gap-2">
                  <Circle className="w-12 h-12 fill-success text-success" />
                  <span className="text-sm text-muted-foreground">Press Space</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Circle className="w-12 h-12 fill-destructive text-destructive" />
                  <span className="text-sm text-muted-foreground">Ignore</span>
                </div>
              </div>
              <Button
                onClick={startGame}
                className="bg-gradient-accent hover:opacity-90"
                size="lg"
              >
                <Zap className="mr-2 w-5 h-5" />
                Start Game
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Progress: {attempts}/{maxAttempts}
                </span>
                <span className="text-muted-foreground">
                  Score: {score}/{attempts}
                </span>
                <span className="text-muted-foreground">
                  Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>

              <div className="aspect-square max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                {showTarget && (
                  <div
                    onClick={handleResponse}
                    className="cursor-pointer animate-pulse"
                  >
                    <Circle
                      className={`w-32 h-32 ${
                        isGreen
                          ? "fill-success text-success"
                          : "fill-destructive text-destructive"
                      }`}
                    />
                  </div>
                )}
                {!showTarget && gameActive && (
                  <p className="text-muted-foreground">Get ready...</p>
                )}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Press SPACEBAR or click the circle when it's green
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CognitiveGame;
