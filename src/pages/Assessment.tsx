import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import CareerReadinessBlock from "@/components/assessment/CareerReadinessBlock";
import AcademicReadinessBlock from "@/components/assessment/AcademicReadinessBlock";
import CognitiveGame from "@/components/assessment/CognitiveGame";
import { CheckCircle2 } from "lucide-react";

type AssessmentPhase = "career" | "academic" | "cognitive" | "complete";

const Assessment = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<AssessmentPhase>("career");
  const [careerAnswers, setCareerAnswers] = useState<any[]>([]);
  const [academicAnswers, setAcademicAnswers] = useState<any[]>([]);
  const [cognitiveScore, setCognitiveScore] = useState<number>(0);

  const getProgress = () => {
    switch (phase) {
      case "career":
        return 10;
      case "academic":
        return 50;
      case "cognitive":
        return 85;
      case "complete":
        return 100;
      default:
        return 0;
    }
  };

  const handleCareerComplete = (answers: any[]) => {
    setCareerAnswers(answers);
    setPhase("academic");
  };

  const handleAcademicComplete = (answers: any[]) => {
    setAcademicAnswers(answers);
    setPhase("cognitive");
  };

  const handleCognitiveComplete = (score: number) => {
    setCognitiveScore(score);
    setPhase("complete");
    // Navigate to results with all data
    setTimeout(() => {
      navigate("/results", {
        state: {
          careerAnswers,
          academicAnswers,
          cognitiveScore: score,
        },
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      <div className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span className="font-medium">
                {phase === "career" && "Career Readiness Assessment"}
                {phase === "academic" && "Academic Readiness Assessment"}
                {phase === "cognitive" && "Cognitive Mini-Games"}
                {phase === "complete" && "Assessment Complete!"}
              </span>
              <span>{getProgress()}% Complete</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </div>
      </div>

      {/* Assessment Content */}
      <div className="container mx-auto px-4 py-8">
        {phase === "career" && (
          <CareerReadinessBlock onComplete={handleCareerComplete} />
        )}
        {phase === "academic" && (
          <AcademicReadinessBlock onComplete={handleAcademicComplete} />
        )}
        {phase === "cognitive" && (
          <CognitiveGame onComplete={handleCognitiveComplete} />
        )}
        {phase === "complete" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-elevated animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-center">Assessment Complete!</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Analyzing your responses and generating personalized recommendations...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessment;
