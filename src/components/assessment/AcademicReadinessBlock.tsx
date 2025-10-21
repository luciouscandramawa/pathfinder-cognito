import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, ArrowRight, Lightbulb } from "lucide-react";

interface Question {
  id: number;
  type: "mcq" | "text";
  question: string;
  options?: string[];
  prompt?: string;
}

const academicQuestions: Question[] = [
  {
    id: 1,
    type: "mcq",
    question: "In a forest ecosystem, if the population of foxes decreases, which conclusion follows logically?",
    options: [
      "The rabbit population will likely increase",
      "The plant population will decrease",
      "The owl population will increase",
      "There will be no significant changes",
    ],
  },
  {
    id: 2,
    type: "text",
    question: "Creative Thinking Challenge",
    prompt: "Suggest three innovative ways to present recycling education to teenagers that would genuinely engage them.",
  },
  {
    id: 3,
    type: "text",
    question: "Problem-Solving Approach",
    prompt: "Describe your approach when facing a problem you've never encountered before. What steps do you take?",
  },
];

interface Props {
  onComplete: (answers: any[]) => void;
}

import { apiNextItem, apiSubmit } from "@/integrations/api/client";

const AcademicReadinessBlock = ({ onComplete }: Props) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [scores, setScores] = useState({ logic: 0, creativity: 0 });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [dynamicItem, setDynamicItem] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState(75);

  const question: any = dynamicItem || academicQuestions[currentQuestion];
  const isLastQuestion = !dynamicItem && currentQuestion === academicQuestions.length - 1;

  useEffect(() => {
    const sid = (window as any).__ASSESS_SESSION_ID__ as string | undefined;
    if (sid) setSessionId(sid);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const sid = (window as any).__ASSESS_SESSION_ID__ as string | undefined;
        if (!sid) return;
        setSessionId(sid);
        const res = await apiNextItem(sid, "academic");
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
          const canSubmit = question.type === "mcq" ? selectedOption !== "" : textAnswer.trim().length > 20;
          if (canSubmit) {
            handleNext();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, dynamicItem]);

  const canProceed =
    question.type === "mcq" ? selectedOption !== "" : textAnswer.trim().length > 20;

  const handleNext = async () => {
    // Simple routing: if MCQ correct (assume option[0] correct for demo), add logic
    if (question.type === "mcq") {
      const correct = question.options?.[0] === selectedOption;
      setScores((prev) => ({ ...prev, logic: prev.logic + (correct ? 2 : 0) }));
    } else {
      // Longer answers count toward creativity
      const extraCreativity = Math.min(3, Math.floor(textAnswer.trim().length / 60));
      setScores((prev) => ({ ...prev, creativity: prev.creativity + 1 + extraCreativity }));
    }

    const answer = {
      questionId: question.id,
      type: question.type,
      answer: question.type === "mcq" ? selectedOption : textAnswer,
      timestamp: Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setSelectedOption("");
    setTextAnswer("");

    if (sessionId && dynamicItem) {
      try {
        await apiSubmit(sessionId, "academic", String(question.id), {
          answer: question.type === "mcq" ? selectedOption : textAnswer,
        });
      } catch {}
    }
    if (isLastQuestion && !dynamicItem) {
      onComplete(newAnswers.concat([{ type: "subscores", value: scores }]));
    } else {
      if (dynamicItem) {
        try {
          const res = await apiNextItem(sessionId!, "academic");
          setDynamicItem(res.item);
        } catch {
          onComplete(newAnswers.concat([{ type: "subscores", value: scores }]));
        }
      } else {
        setCurrentQuestion(currentQuestion + 1);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Academic Readiness</h2>
            <p className="text-muted-foreground">
              Question {currentQuestion + 1} of {academicQuestions.length}
            </p>
          </div>
        </div>
        <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-destructive' : 'text-secondary'}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {question.type === "text" && <Lightbulb className="w-5 h-5 text-secondary" />}
            {question.question}
          </CardTitle>
          {question.prompt && (
            <p className="text-muted-foreground mt-2">{question.prompt}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {question.type === "mcq" ? (
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
          ) : (
            <div className="space-y-2">
              <Textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Share your thoughts here... (minimum 20 characters)"
                className="min-h-[150px] resize-none"
              />
              <p className="text-sm text-muted-foreground text-right">
                {textAnswer.length} characters
              </p>
            </div>
          )}

          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {isLastQuestion ? "Complete Section" : "Next Question"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademicReadinessBlock;
