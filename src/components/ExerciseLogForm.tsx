
import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { Student, Exercise, RecordedExercise, ClassName, StudentGoal } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, MinusCircle, Save, Camera, Activity as ActivityIconLucide } from "lucide-react";
import { format, isToday } from "date-fns"; // isToday import
import { ko } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

interface ExerciseLogFormProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<RecordedExercise, 'id' | 'imageUrl'>) => void;
  recordedExercises: RecordedExercise[];
  onSwitchToCameraMode?: (exerciseId: string) => void;
  availableExercises: Exercise[];
  skippedExercises: Set<string>;
  studentGoals: StudentGoal;
}

const ExerciseLogForm: React.FC<ExerciseLogFormProps> = ({ 
  student, 
  isOpen, 
  onClose, 
  onSave, 
  recordedExercises, 
  onSwitchToCameraMode, 
  availableExercises,
  skippedExercises,
  studentGoals
}) => {
  
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [logValue, setLogValue] = useState<number>(0); 
  const [logDate, setLogDate] = useState<Date>(new Date());
  const { toast } = useToast();
  
  const loggableExercises = useMemo(() => {
    return availableExercises.filter(ex => {
      const goal = studentGoals[ex.id];
      if (!goal || skippedExercises.has(ex.id)) return false;
      return (goal.count ?? 0) > 0 || (goal.time ?? 0) > 0 || (goal.steps ?? 0) > 0;
    });
  }, [availableExercises, studentGoals, skippedExercises]);

  const selectedExercise = loggableExercises.find(ex => ex.id === selectedExerciseId) || loggableExercises[0];
  
  const getInitialLogValue = (exercise: Exercise | null): number => {
    if (!exercise) return 0;
    if (exercise.id === 'squat' || exercise.id === 'jump_rope') return exercise.defaultCount ?? 0;
    if (exercise.id === 'plank') return exercise.defaultTime ?? 0;
    if (exercise.id === 'walk_run') return exercise.defaultSteps ?? 0;
    return 0;
  };
  
  const getStepValue = (exercise: Exercise | null): number => {
    if (!exercise) return 1;
    if (exercise.id === 'squat' || exercise.id === 'jump_rope') return exercise.countStep ?? 1;
    if (exercise.id === 'plank') return exercise.timeStep ?? 1;
    if (exercise.id === 'walk_run') return exercise.stepsStep ?? 1;
    return 1;
  };

  useEffect(() => {
    if (isOpen) {
      const firstLoggableExercise = loggableExercises.length > 0 ? loggableExercises[0] : null;
      const currentSelectionIsValid = selectedExerciseId && loggableExercises.some(ex => ex.id === selectedExerciseId);

      if (!currentSelectionIsValid) {
        setSelectedExerciseId(firstLoggableExercise?.id || '');
      }
      
      setLogDate(new Date());
    }
  }, [isOpen, student, loggableExercises, selectedExerciseId]);

  useEffect(() => {
    const currentExerciseDetails = availableExercises.find(ex => ex.id === selectedExerciseId);
    setLogValue(getInitialLogValue(currentExerciseDetails || null));
  }, [selectedExerciseId, availableExercises]);


  const handleSave = async () => {
    if (!student || !selectedExercise) {
      toast({ title: "오류", description: "학생 정보 또는 운동이 선택되지 않았습니다.", variant: "destructive" });
      return;
    }
    if (logValue === 0) {
        toast({ title: "알림", description: "운동 기록 값이 0입니다. 값을 입력해주세요.", variant: "default"});
    }

    let logEntry: Omit<RecordedExercise, 'id' | 'imageUrl'> = {
      studentId: student.id,
      exerciseId: selectedExercise.id,
      date: format(logDate, "yyyy-MM-dd"), // Use the state logDate, which is set to today
      className: student.class as ClassName,
    };

    if (selectedExercise.id === 'squat' || selectedExercise.id === 'jump_rope') {
      logEntry.countValue = logValue;
    } else if (selectedExercise.id === 'plank') {
      logEntry.timeValue = logValue;
    } else if (selectedExercise.id === 'walk_run') {
      logEntry.stepsValue = logValue;
    }

    onSave(logEntry);
    onClose(); 
  };

  if (!student) return null;
  if (loggableExercises.length === 0) return null;

  const todayStr = format(logDate, "yyyy-MM-dd");
  const exercisesLoggedTodayForStudent = recordedExercises.filter(
    rec => rec.studentId === student.id && rec.date === todayStr && rec.exerciseId === selectedExercise.id
  );

  let totalLoggedTodayDisplay = "";
  let currentUnit = "";
  if (selectedExercise) {
    if (selectedExercise.id === 'squat' || selectedExercise.id === 'jump_rope') {
        const totalCount = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.countValue || 0), 0);
        currentUnit = selectedExercise.countUnit || "";
        if (totalCount > 0) totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${totalCount}${currentUnit}`;
    } else if (selectedExercise.id === 'plank') {
        const totalTime = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.timeValue || 0), 0);
        currentUnit = selectedExercise.timeUnit || "";
        if (totalTime > 0) totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${totalTime}${currentUnit}`;
    } else if (selectedExercise.id === 'walk_run') {
        const totalSteps = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.stepsValue || 0), 0);
        currentUnit = selectedExercise.stepsUnit || "";
        if (totalSteps > 0) totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${totalSteps}${currentUnit}`;
    }
  }
  
  const jumpRopeExercise = availableExercises.find(ex => ex.id === "jump_rope");
  const canUseCameraForExercise = selectedExercise && selectedExercise.id === jumpRopeExercise?.id && onSwitchToCameraMode;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline">{student.name} 학생 운동 기록</DialogTitle>
          <DialogDescription>
            운동을 선택하고, 값을 조절한 후 날짜를 확인하세요. (오늘 날짜만 기록 가능)
          </DialogDescription>
        </DialogHeader>
        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium block mb-2">운동 종류</label>
            {loggableExercises.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {loggableExercises.map((exercise) => {
                  const CurrentExIcon = exercise.icon || ActivityIconLucide;
                  return (
                    <Button
                      key={exercise.id}
                      variant={selectedExerciseId === exercise.id ? "default" : "outline"}
                      onClick={() => setSelectedExerciseId(exercise.id)}
                      className="h-auto py-3 flex flex-col items-center justify-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                      aria-pressed={selectedExerciseId === exercise.id}
                    >
                      <CurrentExIcon className={cn("h-8 w-8 mb-1", selectedExerciseId === exercise.id ? "text-primary-foreground" : "text-primary")} />
                      <span>{exercise.koreanName}</span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">오늘 기록할 수 있는 운동이 없습니다.</p>
            )}
          </div>

          {selectedExercise && (
            <div>
              <label className="text-sm font-medium block mb-2">
                {selectedExercise.koreanName} ({currentUnit})
              </label>
              <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                <Button variant="ghost" size="icon" onClick={() => setLogValue(Math.max(0, logValue - (getStepValue(selectedExercise))))} aria-label="값 감소">
                  <MinusCircle className="h-8 w-8 text-primary" />
                </Button>
                <span className="text-4xl font-bold w-20 text-center">{logValue}</span>
                <Button variant="ghost" size="icon" onClick={() => setLogValue(logValue + (getStepValue(selectedExercise)))} aria-label="값 증가">
                  <PlusCircle className="h-8 w-8 text-primary" />
                </Button>
              </div>
            </div>
          )}

          {totalLoggedTodayDisplay && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {totalLoggedTodayDisplay}
            </p>
          )}

          <div>
            <Label htmlFor="logDate" className="text-sm font-medium block mb-2">날짜 (오늘)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="logDate"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 text-base rounded-lg",
                    !logDate && "text-muted-foreground"
                  )}
                  disabled // 날짜 선택 비활성화, 오늘 날짜로 고정
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {logDate ? format(logDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-lg">
                <Calendar
                  mode="single"
                  selected={logDate}
                  onSelect={(date) => {
                    if (date && isToday(date)) { // 오늘 날짜만 선택 가능하도록 강제
                      setLogDate(date);
                    } else if (date && !isToday(date)) {
                      toast({ title: "알림", description: "오늘 날짜만 기록할 수 있습니다.", variant: "default"});
                      setLogDate(new Date()); // 다른 날짜 선택 시 오늘로 강제
                    }
                  }}
                  initialFocus
                  locale={ko}
                  disabled={(date) => !isToday(date)} // 오늘 이외의 모든 날짜 비활성화
                />
              </PopoverContent>
            </Popover>
          </div>

          {selectedExercise && canUseCameraForExercise && (
            <Button
              variant="secondary"
              className="w-full py-3 text-base rounded-lg mt-4"
              onClick={() => onSwitchToCameraMode!(selectedExercise.id)}
            >
              <Camera className="mr-2 h-5 w-5" /> AI 카메라로 기록 (줄넘기)
            </Button>
          )}

        </CardContent>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg">취소</Button>
          </DialogClose>
          <Button onClick={handleSave} className="py-3 text-base rounded-lg" disabled={!selectedExercise || logValue === 0}>
            <Save className="mr-2 h-5 w-5" />
            기록 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseLogForm;
