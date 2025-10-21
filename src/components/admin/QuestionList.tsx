import { Question } from "@/pages/Admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QuestionListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
}

export function QuestionList({ questions, onEdit, onDelete }: QuestionListProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "mcq": return "bg-blue-500/10 text-blue-500";
      case "text": return "bg-green-500/10 text-green-500";
      case "audio": return "bg-purple-500/10 text-purple-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getBlockColor = (block: string) => {
    return block === "career" 
      ? "bg-orange-500/10 text-orange-500" 
      : "bg-cyan-500/10 text-cyan-500";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Block</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Options</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No questions found. Add your first question to get started.
              </TableCell>
            </TableRow>
          ) : (
            questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell className="max-w-md">
                  <p className="truncate">{question.question}</p>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(question.type)}>
                    {question.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getBlockColor(question.block)}>
                    {question.block}
                  </Badge>
                </TableCell>
                <TableCell>{question.difficulty}/10</TableCell>
                <TableCell>
                  {question.options && question.options.length > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      {question.options.length} options
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this question?")) {
                          onDelete(question.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
