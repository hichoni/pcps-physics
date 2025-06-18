
import type React from 'react';
import type { Student, RecordedExercise, CustomExercise as CustomExerciseType } from '@/lib/types';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, CheckCircle2, Trash2, KeyRound } from 'lucide-react'; 
// import { EXERCISES } from '@/data/mockData'; // Replaced by customExercises prop
import { AVATAR_OPTIONS } from '@/data/avatarOptions';
import { cn } from '@/lib/utils';
import { getIconByName } from '@/lib/iconMap';


interface StudentCardProps {
  student: Student;
  onDeleteStudent: (student: Student) => void;
  onManagePin: (student: Student) => void;
  recordedExercises: RecordedExercise[];
  customExercises: CustomExerciseType[]; // Add customExercises prop
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const formatLastExercise = (exercise: CustomExerciseType | undefined, log: RecordedExercise): string => {
  if (!exercise) return "운동 기록됨 (정보 없음)";
  let parts = [];
  if (exercise.category === 'count_time') {
    if (log.countValue !== undefined && log.countValue > 0) parts.push(`${log.countValue}${exercise.countUnit || ''}`);
    if (log.timeValue !== undefined && log.timeValue > 0) parts.push(`${log.timeValue}${exercise.timeUnit || ''}`);
  } else if (exercise.category === 'steps_distance') {
    if (log.stepsValue !== undefined && log.stepsValue > 0) parts.push(`${log.stepsValue}${exercise.stepsUnit || ''}`);
    if (log.distanceValue !== undefined && log.distanceValue > 0) parts.push(`${log.distanceValue}${exercise.distanceUnit || ''}`);
  }
  return parts.length > 0 ? `${exercise.koreanName}: ${parts.join(', ')}` : `${exercise.koreanName} 기록됨`;
};

const StudentCard: React.FC<StudentCardProps> = ({ student, onDeleteStudent, onManagePin, recordedExercises, customExercises }) => {
  const today = new Date().toISOString().split('T')[0];
  const exercisesLoggedToday = recordedExercises
    .filter(rec => rec.studentId === student.id && rec.date === today)
    .sort((a,b) => (b.id && a.id) ? b.id.localeCompare(a.id) : 0);

  const getLastExerciseLogged = () => {
    if (exercisesLoggedToday.length === 0) return "오늘 기록된 운동 없음";
    const lastLog = exercisesLoggedToday[0]; 
    const exerciseInfo = customExercises.find(ex => ex.id === lastLog.exerciseId);
    return formatLastExercise(exerciseInfo, lastLog);
  }

  const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === student.avatarSeed)?.icon || getIconByName(null); // Fallback to default icon

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center space-x-4 p-4 bg-secondary/30">
          <Avatar className={cn("h-16 w-16 border-2 border-primary p-0.5", SelectedAvatarIcon ? 'bg-background' : 'bg-primary text-primary-foreground')}>
            {student.avatarSeed && AVATAR_OPTIONS.find(opt => opt.id === student.avatarSeed) ? (
              <SelectedAvatarIcon className="h-full w-full text-primary" />
            ) : (
              <AvatarFallback className="text-xl bg-transparent">
                {getInitials(student.name)}
              </AvatarFallback>
            )}
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
           <p className="text-xs text-muted-foreground mt-2">PIN: {student.pin}</p>
        </CardContent>
      </div>
      <CardFooter className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2">
        <Button onClick={() => onManagePin(student)} variant="outline" size="icon" className="rounded-lg py-3 h-auto px-3" aria-label={`${student.name} 학생 PIN 관리`}>
          <KeyRound className="h-5 w-5" />
        </Button>
        <Button onClick={() => onDeleteStudent(student)} variant="destructive" size="icon" className="rounded-lg py-3 h-auto px-3" aria-label={`${student.name} 학생 삭제`}>
          <Trash2 className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentCard;
