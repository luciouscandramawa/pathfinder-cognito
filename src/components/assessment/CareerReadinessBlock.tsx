import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Briefcase, ArrowRight, Video } from "lucide-react";
import VideoPrompt from "./VideoPrompt";

interface Question {
  id: number;
  type: "mcq" | "video";
  question: string;
  options?: string[];
  difficulty?: number;
}

const careerQuestions: Question[] = [
  {
    id: 1,
    type: "mcq",
    question: "A teammate is struggling to meet an important deadline. What would you do?",
    options: [
      "Notify the team leader immediately",
      "Offer to help them with specific tasks",
      "Wait to see if they can handle it alone",
      "Provide advice on time management strategies",
    ],
    difficulty: 1,
  },
  {
    id: 2,
    type: "mcq",
    question: "During a virtual team meeting, you notice someone's idea being ignored. How do you respond?",
    options: [
      "Stay quiet to avoid conflict",
      "Acknowledge their idea and ask for others' thoughts",
      "Move the discussion forward quickly",
      "Support the idea privately after the meeting",
    ],
    difficulty: 2,
  },
  {
    id: 3,
    type: "video",
    question: "You're part of a virtual design team creating a community campaign. Explain how you'd balance creativity with meeting client goals.",
  },
];

interface Props {
  onComplete: (answers: any[]) => void;
}

const CareerReadinessBlock = ({ onComplete }: Props) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");

  const question = careerQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === careerQuestions.length - 1;

  const handleNext = () => {
    const answer = {
      questionId: question.id,
      type: question.type,
      answer: selectedOption,
      timestamp: Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setSelectedOption("");

    if (isLastQuestion) {
      onComplete(newAnswers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleVideoComplete = (videoData: any) => {
    const answer = {
      questionId: question.id,
      type: "video",
      videoData,
      timestamp: Date.now(),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      onComplete(newAnswers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Career Readiness</h2>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {careerQuestions.length}
          </p>
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
        <VideoPrompt
          question={question.question}
          onComplete={handleVideoComplete}
          icon={<Video className="w-6 h-6 text-primary" />}
        />
      )}
    </div>
  );
};

export default CareerReadinessBlock;
