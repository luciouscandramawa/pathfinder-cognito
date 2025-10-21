import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Briefcase, ArrowRight, Mic } from "lucide-react";
import AudioPrompt from "./AudioPrompt";
import { apiNextItem, apiSubmit } from "@/integrations/api/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  id: string;
  type: "mcq" | "audio" | "text";
  question: string;
  options?: string[];
  difficulty?: number;
}

interface Props {
  onComplete: (answers: any[]) => void;
}

const CareerReadinessBlock = ({ onComplete }: Props) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [scores, setScores] = useState({ teamwork: 0, empathy: 0, communication: 0 });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dynamicItem, setDynamicItem] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState(75);
  const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const question = dynamicItem || (dbQuestions.length > 0 ? dbQuestions[currentQuestion] : null);
  const isLastQuestion = !dynamicItem && dbQuestions.length > 0 && currentQuestion === dbQuestions.length - 1;

  useEffect(() => {
    const sid = (window as any).__ASSESS_SESSION_ID__ as string | undefined;
    if (sid) setSessionId(sid);
    
    // Load questions from database
    loadQuestionsFromDB();
  }, []);

  const loadQuestionsFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("block", "career")
        .order("difficulty", { ascending: true });

      if (error) throw error;
      
      const formattedQuestions = (data || []).map(q => ({
        id: q.id,
        type: q.type as "mcq" | "audio" | "text",
        question: q.question,
        options: q.options ? (Array.isArray(q.options) ? q.options as string[] : []) : undefined,
        difficulty: q.difficulty
      }));
      
      setDbQuestions(formattedQuestions);
    } catch (error: any) {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // try to fetch the next adaptive item if we have a session
    (async () => {
      try {
        const sid = (window as any).__ASSESS_SESSION_ID__ as string | undefined;
        if (!sid) return;
        setSessionId(sid);
        const res = await apiNextItem(sid, "career");
        setDynamicItem(res.item);
      } catch {
        setDynamicItem(null);
      }
    })();
  }, []);

  useEffect(() => {
    setTimeLeft(75);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (question.type === "mcq" && selectedOption) {
            handleNext();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, dynamicItem]);

  const handleNext = async () => {
    // Simple rule-based scoring for MCQs
    const option = selectedOption;
    const optionScore = (() => {
      // Heuristic: offer help/acknowledge -> higher empathy/teamwork
      if (option.includes("help")) return { teamwork: 2, empathy: 2, communication: 1 };
      if (option.includes("Acknowledge") || option.toLowerCase().includes("acknowledge")) return { teamwork: 1, empathy: 1, communication: 2 };
      if (option.includes("leader") || option.toLowerCase().includes("notify")) return { teamwork: 1, empathy: 0, communication: 1 };
      if (option.toLowerCase().includes("wait") || option.toLowerCase().includes("ignore")) return { teamwork: 0, empathy: 0, communication: 0 };
      if (option.toLowerCase().includes("advice") || option.toLowerCase().includes("advise")) return { teamwork: 1, empathy: 1, communication: 1 };
      return { teamwork: 1, empathy: 1, communication: 1 };
    })();
    setScores((prev) => ({
      teamwork: prev.teamwork + optionScore.teamwork,
      empathy: prev.empathy + optionScore.empathy,
      communication: prev.communication + optionScore.communication,
    }));

    const answer = {
      questionId: question.id,
      type: question.type,
      answer: selectedOption,
      timestamp: Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setSelectedOption("");

    if (sessionId && dynamicItem) {
      try { await apiSubmit(sessionId, "career", String(question.id), { answer: selectedOption }); } catch {}
    }
    if (isLastQuestion && !dynamicItem) {
      onComplete(newAnswers.concat([{ type: "subscores", value: scores }]))
    } else {
      if (dynamicItem) {
        // fetch next adaptive item
        try {
          const res = await apiNextItem(sessionId!, "career");
          setDynamicItem(res.item);
        } catch {
          onComplete(newAnswers.concat([{ type: "subscores", value: scores }]));
        }
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    }
  };

  const handleAudioComplete = async (audioData: any) => {
    // If transcript sentiment present, boost communication score
    let communicationBoost = 0;
    const sent = audioData?.sentiment as Array<{ label: string; score: number }> | undefined;
    if (Array.isArray(sent) && sent.length > 0) {
      const positive = sent.find((s) => s.label.toUpperCase().includes("POSITIVE"));
      if (positive) {
        communicationBoost = Math.round(positive.score * 3);
      }
    }
    if (communicationBoost > 0) {
      setScores((prev) => ({ ...prev, communication: prev.communication + communicationBoost }));
    }

    const answer = {
      questionId: question.id,
      type: "audio",
      audioData,
      timestamp: Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (sessionId && dynamicItem) {
      try { await apiSubmit(sessionId, "career", String(question.id), audioData); } catch {}
    }
    if (isLastQuestion && !dynamicItem) {
      onComplete(newAnswers.concat([{ type: "subscores", value: { ...scores, communication: scores.communication + communicationBoost } }]))
    } else {
      if (dynamicItem) {
        try {
          const res = await apiNextItem(sessionId!, "career");
          setDynamicItem(res.item);
        } catch {
          onComplete(newAnswers.concat([{ type: "subscores", value: { ...scores, communication: scores.communication + communicationBoost } }]));
        }
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  if (!question || dbQuestions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-muted-foreground">No questions available. Please contact an administrator.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Career Readiness</h2>
            <p className="text-muted-foreground">
              Question {currentQuestion + 1} of {dbQuestions.length}
            </p>
          </div>
        </div>
        <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-destructive' : 'text-primary'}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      {question.type === "mcq" ? (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {question.options?.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOption(option)}
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {isLastQuestion ? "Complete Section" : "Next Question"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AudioPrompt
          question={question.question}
          onComplete={handleAudioComplete}
          icon={<Mic className="w-6 h-6 text-primary" />}
        />
      )}
    </div>
  );
};

export default CareerReadinessBlock;
