
import type React from 'react';
import type { Student, RecordedExercise, Exercise as ExerciseType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, CheckCircle2, Trash2, UserCircle2 } from 'lucide-react';
import { EXERCISES } from '@/data/mockData';

interface StudentCardProps {
  student: Student;
  onLogExercise: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
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

const formatLastExercise = (exercise: ExerciseType, log: RecordedExercise): string => {
  let parts = [];
  if (exercise.category === 'count_time') {
    if (log.countValue !== undefined) parts.push(`${log.countValue}${exercise.countUnit}`);
    if (log.timeValue !== undefined) parts.push(`${log.timeValue}${exercise.timeUnit}`);
  } else if (exercise.category === 'steps_distance') {
    if (log.stepsValue !== undefined) parts.push(`${log.stepsValue}${exercise.stepsUnit}`);
    if (log.distanceValue !== undefined) parts.push(`${log.distanceValue}${exercise.distanceUnit}`);
  }
  return parts.length > 0 ? `${exercise.koreanName}: ${parts.join(', ')}` : "운동 기록됨";
};

const StudentCard: React.FC<StudentCardProps> = ({ student, onLogExercise, onDeleteStudent, recordedExercises }) => {
  const placeholderAvatarUrl = `https://placehold.co/80x80.png?text=${getInitials(student.name)}&bg=87CEEB&fg=FFFFFF`;
  
  const today = new Date().toISOString().split('T')[0];
  const exercisesLoggedToday = recordedExercises
    .filter(rec => rec.studentId === student.id && rec.date === today)
    .sort((a,b) => b.id.localeCompare(a.id));

  const getLastExerciseLogged = () => {
    if (exercisesLoggedToday.length === 0) return "오늘 기록된 운동 없음";
    const lastLog = exercisesLoggedToday[0]; 
    const exerciseInfo = EXERCISES.find(ex => ex.id === lastLog.exerciseId);
    return exerciseInfo ? formatLastExercise(exerciseInfo, lastLog) : "운동 기록됨";
  }

  const avatarHint = student.gender === 'male' ? 'boy portrait' : 'girl portrait';

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center space-x-4 p-4 bg-secondary/30">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage 
              src={student.avatarSeed && !student.avatarSeed.startsWith('https://') ? placeholderAvatarUrl : student.avatarSeed} 
              alt={student.name} 
              data-ai-hint={avatarHint} 
            />
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl font-headline">{student.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {student.class} {student.studentNumber}번 ({student.gender === 'male' ? '남' : '여'})
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-2">최근 활동:</div>
          <div className="flex items-center gap-2">
            {exercisesLoggedToday.length > 0 ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <Activity className="h-5 w-5 text-muted-foreground/50" />}
            <p className="text-sm truncate" title={getLastExerciseLogged()}>{getLastExerciseLogged()}</p>
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-4 bg-slate-50 dark:bg-slate-800/30 flex gap-2">
        <Button onClick={() => onLogExercise(student)} className="w-full py-3 text-base rounded-lg" aria-label={`${student.name} 학생 운동 기록`}>
          <Activity className="mr-2 h-5 w-5" /> 기록
        </Button>
        <Button onClick={() => onDeleteStudent(student)} variant="destructive" size="icon" className="rounded-lg py-3 h-auto px-3" aria-label={`${student.name} 학생 삭제`}>
          <Trash2 className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentCard;
