import type React from 'react';
import type { Student, RecordedExercise, Exercise as ExerciseType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2 } from 'lucide-react';
import { EXERCISES } from '@/data/mockData';

interface StudentCardProps {
  student: Student;
  onLogExercise: (student: Student) => void;
  recordedExercises: RecordedExercise[];
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const StudentCard: React.FC<StudentCardProps> = ({ student, onLogExercise, recordedExercises }) => {
  const placeholderAvatarUrl = `https://placehold.co/80x80.png?text=${getInitials(student.name)}&bg=87CEEB&fg=FFFFFF`;
  
  const today = new Date().toISOString().split('T')[0];
  const exercisesLoggedToday = recordedExercises.filter(
    rec => rec.studentId === student.id && rec.date === today
  );

  const getLastExerciseLogged = () => {
    if (exercisesLoggedToday.length === 0) return "No exercises logged today";
    const lastLog = exercisesLoggedToday[exercisesLoggedToday.length - 1];
    const exerciseInfo = EXERCISES.find(ex => ex.id === lastLog.exerciseId);
    return exerciseInfo ? `${exerciseInfo.name}: ${lastLog.value} ${exerciseInfo.unit}` : "Exercise logged";
  }

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center space-x-4 p-4 bg-secondary/30">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={placeholderAvatarUrl} alt={student.name} data-ai-hint="child portrait" />
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">{getInitials(student.name)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl font-headline">{student.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{student.class}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground mb-2">Last activity:</div>
        <div className="flex items-center gap-2">
          {exercisesLoggedToday.length > 0 ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Activity className="h-5 w-5 text-muted-foreground/50" />}
          <p className="text-sm truncate" title={getLastExerciseLogged()}>{getLastExerciseLogged()}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-slate-50 dark:bg-slate-800/30">
        <Button onClick={() => onLogExercise(student)} className="w-full py-3 text-base rounded-lg" aria-label={`Log exercise for ${student.name}`}>
          <Activity className="mr-2 h-5 w-5" /> Log Exercise
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentCard;
