"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Container } from '@/components/layout/container';
import { Loader2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
};

type TestData = {
  questions: Question[];
  jobTitle: string;
  companyName: string;
};

export default function TestPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTest();
    }
  }, [params.id]);

  useEffect(() => {
    if (testData && !testCompleted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testData, testCompleted]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}/test`);
      if (response.ok) {
        const data = await response.json();
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setTestData(data);
          setAnswers(new Array(data.questions.length).fill(-1));
        } else {
          toast({
            title: "Erreur",
            description: "Aucune question disponible pour ce test",
            variant: "destructive"
          });
          router.push('/dashboard');
        }
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.error || "Impossible de charger le test",
          variant: "destructive"
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Failed to fetch test", error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null && testData) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = selectedAnswer;
      setAnswers(newAnswers);
      setSelectedAnswer(null);

      if (currentQuestion < testData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(newAnswers[currentQuestion + 1] !== -1 ? newAnswers[currentQuestion + 1] : null);
      } else {
        handleSubmitTest(newAnswers);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      const newAnswers = [...answers];
      if (selectedAnswer !== null) {
        newAnswers[currentQuestion] = selectedAnswer;
        setAnswers(newAnswers);
      }
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(newAnswers[currentQuestion - 1] !== -1 ? newAnswers[currentQuestion - 1] : null);
    }
  };

  const handleSubmitTest = async (finalAnswers?: number[]) => {
    if (submitting) return;
    
    setSubmitting(true);
    const answersToSubmit = finalAnswers || answers;
    
    if (selectedAnswer !== null && !finalAnswers) {
      answersToSubmit[currentQuestion] = selectedAnswer;
    }

    try {
      const response = await fetch(`/api/applications/${params.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersToSubmit }),
      });

      if (response.ok) {
        const result = await response.json();
        setScore(result.score);
        setTestCompleted(true);
        
        if (result.score >= 60) {
          toast({
            title: "Félicitations ! 🎉",
            description: `Test réussi avec ${result.score}% ! Votre candidature passe à l'étape suivante.`,
            duration: 5000,
          });
        } else {
          toast({
            title: "Test terminé",
            description: `Score: ${result.score}%. Malheureusement, le score minimum n'a pas été atteint.`,
            variant: "destructive",
            duration: 5000,
          });
        }
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de soumettre le test",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 600) return 'text-green-600'; // > 10 min
    if (timeLeft > 300) return 'text-yellow-600'; // > 5 min
    return 'text-red-600'; // < 5 min
  };

  if (loading) {
    return (
      <Container>
        <div className="flex h-96 justify-center items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Chargement du test...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!testData || !testData.questions || testData.questions.length === 0) {
    return (
      <Container>
        <div className="flex h-96 justify-center items-center">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Test non disponible</h2>
            <p className="text-muted-foreground mb-4">Aucune question n'a pu être générée pour ce test.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Retour au dashboard
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (testCompleted) {
    return (
      <Container>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {score !== null && score >= 60 ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {score !== null && score >= 60 ? 'Test réussi !' : 'Test terminé'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-4xl font-bold text-blue-600">
                {score !== null ? `${score}%` : 'N/A'}
              </div>
              <p className="text-muted-foreground">
                {score !== null && score >= 60 
                  ? 'Félicitations ! Votre candidature passe à l\'étape suivante.'
                  : 'Le score minimum de 60% n\'a pas été atteint.'}
              </p>
              <div className="pt-4">
                <Button onClick={() => router.push('/dashboard')} size="lg">
                  Retour au dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  const currentQ = testData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / testData.questions.length) * 100;

  return (
    <Container>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Test Technique</h1>
              <p className="text-muted-foreground">
                {testData.jobTitle} - {testData.companyName}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getTimeColor()}`}>
                <Clock className="inline w-5 h-5 mr-1" />
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-muted-foreground">Temps restant</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestion + 1} sur {testData.questions.length}</span>
              <span>{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Question {currentQuestion + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-lg leading-relaxed">{currentQ.question}</p>
              
              <RadioGroup
                value={selectedAnswer?.toString()}
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
              >
                {currentQ.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
          >
            Question précédente
          </Button>
          
          <div className="flex gap-2">
            {testData.questions.map((_, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== -1
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : currentQuestion === testData.questions.length - 1 ? (
              'Terminer le test'
            ) : (
              'Question suivante'
            )}
          </Button>
        </div>

        {/* Instructions */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Instructions :</p>
                <ul className="space-y-1">
                  <li>• Chaque question vaut 10 points (100 points au total)</li>
                  <li>• Score minimum requis : 60%</li>
                  <li>• Temps limite : 30 minutes</li>
                  <li>• Une seule tentative autorisée</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
