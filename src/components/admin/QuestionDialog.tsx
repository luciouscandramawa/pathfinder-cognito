import { useState, useEffect } from "react";
import { Question } from "@/types/question";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  onSave: () => void;
}

export function QuestionDialog({ open, onOpenChange, question, onSave }: QuestionDialogProps) {
  const [formData, setFormData] = useState({
    question: "",
    type: "text" as "mcq" | "text" | "audio",
    difficulty: 5,
    block: "career" as "career" | "academic",
    options: [] as string[],
  });
  const [newOption, setNewOption] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (question) {
      setFormData({
        question: question.question,
        type: question.type,
        difficulty: question.difficulty,
        block: question.block,
        options: question.options || [],
      });
    } else {
      setFormData({
        question: "",
        type: "text",
        difficulty: 5,
        block: "career",
        options: [],
      });
    }
  }, [question]);

  const handleAddOption = () => {
    if (newOption.trim() && formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()],
      });
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (formData.type === "mcq" && formData.options.length < 2) {
        toast.error("MCQ questions must have at least 2 options");
        setSaving(false);
        return;
      }

      const questionData = {
        question: formData.question,
        type: formData.type,
        difficulty: formData.difficulty,
        block: formData.block,
        options: formData.type === "mcq" ? formData.options : null,
      };

      if (question) {
        const { error } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", question.id);

        if (error) throw error;
        toast.success("Question updated successfully");
      } else {
        const { error } = await supabase
          .from("questions")
          .insert([questionData]);

        if (error) throw error;
        toast.success("Question added successfully");
      }

      onSave();
    } catch (error: any) {
      toast.error(error.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? "Edit Question" : "Add New Question"}</DialogTitle>
          <DialogDescription>
            Fill in the details for the assessment question
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Enter the question text..."
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "mcq" | "text" | "audio") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="text">Text Response</SelectItem>
                  <SelectItem value="audio">Audio Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block">Block</Label>
              <Select
                value={formData.block}
                onValueChange={(value: "career" | "academic") =>
                  setFormData({ ...formData, block: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career">Career Readiness</SelectItem>
                  <SelectItem value="academic">Academic Readiness</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">
              Difficulty: {formData.difficulty}/10
            </Label>
            <Input
              id="difficulty"
              type="range"
              min="1"
              max="10"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: parseInt(e.target.value) })
              }
            />
          </div>

          {formData.type === "mcq" && (
            <div className="space-y-2">
              <Label>Answer Options</Label>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add an option..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddOption}>
                  Add
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {formData.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{option}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
