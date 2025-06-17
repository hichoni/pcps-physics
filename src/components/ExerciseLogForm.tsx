import type React from 'react';
import { useState, useEffect } from 'react';
import type { Student, Exercise, RecordedExercise, ClassName } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CardContent } from "@/components/ui/card"; // Added import
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EXERCISES } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, MinusCircle, Save } from "lucide-react";
import { format } from "date-fns";
import { ko } from 'date-fns/locale';

interface ExerciseLogFormProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<RecordedExercise, 'id'>) => void;
  recordedExercises: RecordedExercise[];
}

const ExerciseLogForm: React.FC<ExerciseLogFormProps> = ({ student, isOpen, onClose, onSave, recordedExercises }) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISES[0].id);
  
  // States for 'count_time' category
  const [countLogValue, setCountLogValue] = useState<number>(EXERCISES[0].defaultCount ?? 0);
  const [timeLogValue, setTimeLogValue] = useState<number>(EXERCISES[0].defaultTime ?? 0);

  // States for 'steps_distance' category
  const [stepsLogValue, setStepsLogValue] = useState<number>(EXERCISES[0].defaultSteps ?? 0);
  const [distanceLogValue, setDistanceLogValue] = useState<number>(EXERCISES[0].defaultDistance ?? 0);
  
  const [logDate, setLogDate] = useState<Date>(new Date());

  const selectedExercise = EXERCISES.find(ex => ex.id === selectedExerciseId) || EXERCISES[0];

  useEffect(() => {
    if (student && isOpen) {
      const currentEx = EXERCISES.find(ex => ex.id === selectedExerciseId) || EXERCISES[0];
      setSelectedExerciseId(currentEx.id); // Ensure selectedExerciseId is current
      
      if (currentEx.category === 'count_time') {
        setCountLogValue(currentEx.defaultCount ?? 0);
        setTimeLogValue(currentEx.defaultTime ?? 0);
      } else if (currentEx.category === 'steps_distance') {
        setStepsLogValue(currentEx.defaultSteps ?? 0);
        setDistanceLogValue(currentEx.defaultDistance ?? 0);
      }
      setLogDate(new Date());
    }
  }, [student, isOpen, selectedExerciseId]); // Added selectedExerciseId dependency

  useEffect(() => {
    // Reset values when selected exercise changes
    const currentExerciseDetails = EXERCISES.find(ex => ex.id === selectedExerciseId);
    if (currentExerciseDetails) {
      if (currentExerciseDetails.category === 'count_time') {
        setCountLogValue(currentExerciseDetails.defaultCount ?? 0);
        setTimeLogValue(currentExerciseDetails.defaultTime ?? 0);
      } else if (currentExerciseDetails.category === 'steps_distance') {
        setStepsLogValue(currentExerciseDetails.defaultSteps ?? 0);
        setDistanceLogValue(currentExerciseDetails.defaultDistance ?? 0);
      }
    }
  }, [selectedExerciseId]);


  const handleSave = () => {
    if (!student || !selectedExercise) return;
    
    let logEntry: Omit<RecordedExercise, 'id'> = {
      studentId: student.id,
      exerciseId: selectedExercise.id,
      date: format(logDate, "yyyy-MM-dd"),
      className: student.class as ClassName,
    };

    if (selectedExercise.category === 'count_time') {
      logEntry.countValue = countLogValue;
      logEntry.timeValue = timeLogValue;
    } else if (selectedExercise.category === 'steps_distance') {
      logEntry.stepsValue = stepsLogValue;
      logEntry.distanceValue = distanceLogValue;
    }
    
    onSave(logEntry);
    onClose();
  };

  if (!student) return null;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const exercisesLoggedTodayForStudent = recordedExercises.filter(
    rec => rec.studentId === student.id && rec.date === todayStr && rec.exerciseId === selectedExercise.id
  );

  let totalLoggedTodayDisplay = "";
  if (selectedExercise.category === 'count_time') {
    const totalCount = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.countValue || 0), 0);
    const totalTime = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.timeValue || 0), 0);
    if (totalCount > 0 || totalTime > 0) {
      totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${totalCount}${selectedExercise.countUnit || ''}, ${totalTime}${selectedExercise.timeUnit || ''}`;
    }
  } else if (selectedExercise.category === 'steps_distance') {
    const totalSteps = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.stepsValue || 0), 0);
    const totalDistance = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.distanceValue || 0), 0);
     if (totalSteps > 0 || totalDistance > 0) {
      totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${totalSteps}${selectedExercise.stepsUnit || ''}, ${totalDistance}${selectedExercise.distanceUnit || ''}`;
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline">{student.name} 학생 운동 기록</DialogTitle>
          <DialogDescription>
            운동을 선택하고, 값을 조절한 후 날짜를 선택하세요.
          </DialogDescription>
        </DialogHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium block mb-2">운동 종류</label>
            <div className="grid grid-cols-2 gap-3">
              {EXERCISES.map((exercise) => (
                <Button
                  key={exercise.id}
                  variant={selectedExerciseId === exercise.id ? "default" : "outline"}
                  onClick={() => setSelectedExerciseId(exercise.id)}
                  className="h-auto py-3 flex flex-col items-center justify-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                  aria-pressed={selectedExerciseId === exercise.id}
                >
                  <exercise.icon className={cn("h-8 w-8 mb-1", selectedExerciseId === exercise.id ? "text-primary-foreground" : "text-primary")} />
                  <span>{exercise.koreanName}</span>
                </Button>
              ))}
            </div>
          </div>

          {selectedExercise.category === 'count_time' && (
            <>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {selectedExercise.koreanName} ({selectedExercise.countUnit})
                </label>
                <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setCountLogValue(Math.max(selectedExercise.countStep ?? 0, countLogValue - (selectedExercise.countStep ?? 1)))} aria-label="횟수 감소">
                    <MinusCircle className="h-8 w-8 text-primary" />
                  </Button>
                  <span className="text-4xl font-bold w-20 text-center">{countLogValue}</span>
                  <Button variant="ghost" size="icon" onClick={() => setCountLogValue(countLogValue + (selectedExercise.countStep ?? 1))} aria-label="횟수 증가">
                    <PlusCircle className="h-8 w-8 text-primary" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {selectedExercise.koreanName} ({selectedExercise.timeUnit})
                </label>
                <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setTimeLogValue(Math.max(selectedExercise.timeStep ?? 0, timeLogValue - (selectedExercise.timeStep ?? 1)))} aria-label="시간 감소">
                    <MinusCircle className="h-8 w-8 text-primary" />
                  </Button>
                  <span className="text-4xl font-bold w-20 text-center">{timeLogValue}</span>
                  <Button variant="ghost" size="icon" onClick={() => setTimeLogValue(timeLogValue + (selectedExercise.timeStep ?? 1))} aria-label="시간 증가">
                    <PlusCircle className="h-8 w-8 text-primary" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {selectedExercise.category === 'steps_distance' && (
            <>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {selectedExercise.koreanName} ({selectedExercise.stepsUnit})
                </label>
                <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setStepsLogValue(Math.max(selectedExercise.stepsStep ?? 0, stepsLogValue - (selectedExercise.stepsStep ?? 1)))} aria-label="걸음 수 감소">
                    <MinusCircle className="h-8 w-8 text-primary" />
                  </Button>
                  <span className="text-4xl font-bold w-20 text-center">{stepsLogValue}</span>
                  <Button variant="ghost" size="icon" onClick={() => setStepsLogValue(stepsLogValue + (selectedExercise.stepsStep ?? 1))} aria-label="걸음 수 증가">
                    <PlusCircle className="h-8 w-8 text-primary" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {selectedExercise.koreanName} ({selectedExercise.distanceUnit})
                </label>
                <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setDistanceLogValue(Math.max(selectedExercise.distanceStep ?? 0, distanceLogValue - (selectedExercise.distanceStep ?? 1)))} aria-label="거리 감소">
                    <MinusCircle className="h-8 w-8 text-primary" />
                  </Button>
                  <span className="text-4xl font-bold w-20 text-center">{distanceLogValue}</span>
                  <Button variant="ghost" size="icon" onClick={() => setDistanceLogValue(distanceLogValue + (selectedExercise.distanceStep ?? 1))} aria-label="거리 증가">
                    <PlusCircle className="h-8 w-8 text-primary" />
                  </Button>
                </div>
              </div>
            </>
          )}
          {totalLoggedTodayDisplay && (
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                    {totalLoggedTodayDisplay}
                </p>
            )}
          
          <div>
            <label className="text-sm font-medium block mb-2">날짜</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 text-base rounded-lg",
                    !logDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {logDate ? format(logDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-lg">
                <Calendar
                  mode="single"
                  selected={logDate}
                  onSelect={(date) => date && setLogDate(date)}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg">취소</Button>
          </DialogClose>
          <Button onClick={handleSave} className="py-3 text-base rounded-lg">
            <Save className="mr-2 h-5 w-5" /> 기록 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseLogForm;
