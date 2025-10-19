import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Download,
  Home,
  Sparkles,
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { apiRecommendations } from "@/integrations/api/client";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state || {};
  // Derive scores from answers
  const careerSubs = Array.isArray(data.careerAnswers)
    ? (data.careerAnswers.find((a: any) => a?.type === "subscores")?.value || { teamwork: 0, empathy: 0, communication: 0 })
    : { teamwork: 0, empathy: 0, communication: 0 };
  const academicSubs = Array.isArray(data.academicAnswers)
    ? (data.academicAnswers.find((a: any) => a?.type === "subscores")?.value || { logic: 0, creativity: 0 })
    : { logic: 0, creativity: 0 };
  const focusScore = typeof data.cognitiveScore === "number" ? data.cognitiveScore : 75;

  const [dynamicCareers, setDynamicCareers] = useState<any[] | null>(null);
  const [dynamicMajors, setDynamicMajors] = useState<string[] | null>(null);

  const subscores = useMemo(() => {
    if (data?.subscores) return data.subscores as Record<string, number>;
    return { teamwork: careerSubs.teamwork || 0, empathy: careerSubs.empathy || 0, communication: careerSubs.communication || 0, logic: academicSubs.logic || 0, creativity: academicSubs.creativity || 0 };
  }, [data, careerSubs, academicSubs]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRecommendations(subscores);
        setDynamicCareers(res.careers);
        setDynamicMajors(res.majors);
      } catch {
        setDynamicCareers(null);
        setDynamicMajors(null);
      }
    })();
  }, [subscores]);

  // Mock analysis based on assessment data
  const norm = (val: number, max: number) => Math.max(0, Math.min(100, Math.round((val / max) * 100)));
  const skillsData = [
    { skill: "Logic", score: norm(academicSubs.logic || 0, 6) },
    { skill: "Creativity", score: norm(academicSubs.creativity || 0, 6) },
    { skill: "Communication", score: norm(careerSubs.communication || 0, 8) },
    { skill: "Focus", score: focusScore },
    { skill: "Problem Solving", score: norm((academicSubs.logic || 0) + (careerSubs.teamwork || 0), 10) },
  ];

  const careerRecommendations = dynamicCareers || [
    {
      title: "UX/UI Designer",
      match: 94,
      description: "Your creativity and communication skills align perfectly with user experience design.",
      category: "Design & Creative",
    },
    {
      title: "Product Manager",
      match: 89,
      description: "Strong problem-solving and teamwork make you ideal for product management.",
      category: "Business & Management",
    },
    {
      title: "Data Analyst",
      match: 85,
      description: "Logical thinking and attention to detail suit analytical roles.",
      category: "Technology & Analytics",
    },
  ];

  const majorRecommendations = dynamicMajors || ["Human-Computer Interaction", "Business Administration with Tech Focus", "Psychology with Design Thinking", "Information Systems"];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary shadow-elevated mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Your Assessment Results</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Personalized insights based on your adaptive assessment performance
          </p>
        </div>

        {/* Skills Radar Chart */}
        <Card className="shadow-elevated animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Brain className="w-6 h-6 text-primary" />
              Competency Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={skillsData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 14 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Your Scores"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Career Recommendations */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Top Career Matches</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {careerRecommendations.map((career, index) => (
              <Card
                key={index}
                className="shadow-card hover:shadow-elevated transition-all duration-300 border-l-4 border-l-primary"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{career.title}</CardTitle>
                    <Badge className="bg-gradient-primary">
                      {career.match}% match
                    </Badge>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {career.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{career.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Academic Recommendations */}
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <GraduationCap className="w-6 h-6 text-secondary" />
              Recommended Majors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {majorRecommendations.map((major, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-primary" />
                  <span className="font-medium">{major}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card className="shadow-card animate-fade-in border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="w-6 h-6 text-accent" />
              Key Insights & Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <h4 className="font-semibold text-success mb-2">✓ Strong Areas</h4>
                <p className="text-sm text-muted-foreground">
                  Exceptional creativity and communication skills. Your ability to think outside
                  the box and express ideas clearly is a significant strength.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">→ Growth Opportunities</h4>
                <p className="text-sm text-muted-foreground">
                  Consider developing stronger technical skills and data analysis capabilities
                  to complement your creative strengths.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h4 className="font-semibold text-accent mb-2">⚡ Recommended Actions</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Explore design thinking workshops or courses</li>
                  <li>Build a portfolio showcasing your creative projects</li>
                  <li>Connect with professionals in UX/UI design</li>
                  <li>Consider internships in product development</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center animate-fade-in">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-gradient-primary hover:opacity-90 gap-2"
            size="lg"
          >
            <Download className="w-5 h-5" />
            Download Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
