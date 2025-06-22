
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Exercise, Student, StudentGoal, ExerciseGoal } from '@/lib/types';
import { Target, Save, X, PlusCircle, MinusCircle, Waves, Check } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SetStudentGoalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { date: Date, goals: StudentGoal, skipped: Set<string> }) => void;
  date: Date;
  exercises: Exercise[]; 
  currentStudent: Student | null;
  initialGoals: StudentGoal;
  skippedExercises: Set<string>;
}

const SetStudentGoalsDialog: React.FC<SetStudentGoalsDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  date,
  exercises, 
  currentStudent, 
  initialGoals,
  skippedExercises,
}) => {
  const [goals, setGoals] = useState<StudentGoal>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const newGoalsState: StudentGoal = {};
      exercises.forEach(ex => {
        const initialGoal = initialGoals[ex.id] || {};
        const specificGoal: ExerciseGoal = {};

        if (ex.category === 'count_time') {
          if (ex.countUnit) {
            specificGoal.count = initialGoal.count ?? ex.defaultCount ?? 0;
          }
          if (ex.timeUnit) {
            specificGoal.time = initialGoal.time ?? ex.defaultTime ?? 0;
          }
        } else if (ex.category === 'steps_distance') {
          if (ex.stepsUnit) {
            specificGoal.steps = initialGoal.steps ?? ex.defaultSteps ?? 0;
          }
        }
        newGoalsState[ex.id] = specificGoal;
      });
      setGoals(newGoalsState);
      setSkipped(new Set(skippedExercises));
    }
  }, [isOpen, exercises, initialGoals, skippedExercises, date]);

  const handleValueChange = (exerciseId: string, field: keyof ExerciseGoal, delta: number) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    let step = 1;
    if (field === 'count') step = exercise.countStep || 1;
    else if (field === 'time') step = exercise.timeStep || 1;
    else if (field === 'steps') step = exercise.stepsStep || 1;
    
    setGoals(prevGoals => {
      const currentGoalForExercise = prevGoals[exerciseId] || {};
      const currentVal = currentGoalForExercise[field] ?? 0;
      const newVal = Math.max(0, currentVal + (delta * step));

      const newGoalState: ExerciseGoal = {
          ...currentGoalForExercise,
          [field]: newVal,
      };

      return {
        ...prevGoals,
        [exerciseId]: newGoalState,
      };
    });
  };

  const handleSkipToggle = (exerciseId: string, isNowSkipped: boolean) => {
    setSkipped(prev => {
        const newSkipped = new Set(prev);
        if (isNowSkipped) {
            newSkipped.add(exerciseId);
        } else {
            newSkipped.delete(exerciseId);
        }
        return newSkipped;
    });

    if (!isNowSkipped) {
        const exercise = exercises.find(e => e.id === exerciseId);
        if (exercise) {
            const initialGoalForExercise = initialGoals[exercise.id] || {};
            const specificGoal: ExerciseGoal = {};

            if (exercise.category === 'count_time') {
              if (exercise.countUnit) {
                specificGoal.count = initialGoalForExercise.count ?? exercise.defaultCount ?? 0;
              }
              if (exercise.timeUnit) {
                specificGoal.time = initialGoalForExercise.time ?? exercise.defaultTime ?? 0;
              }
            } else if (exercise.category === 'steps_distance') {
              if (exercise.stepsUnit) {
                specificGoal.steps = initialGoalForExercise.steps ?? exercise.defaultSteps ?? 0;
              }
            }
            
            setGoals(prevGoals => ({
                ...prevGoals,
                [exerciseId]: specificGoal,
            }));
        }
    }
  };

  const handleDialogSave = () => {
    const goalsToSave: StudentGoal = {};
    Object.keys(goals).forEach(exId => {
        if (!skipped.has(exId)) {
            const exGoal = goals[exId];
            const cleanedExGoal: ExerciseGoal = {};
            if (exGoal.count !== undefined && exGoal.count > 0) {
              cleanedExGoal.count = exGoal.count;
            }
            if (exGoal.time !== undefined && exGoal.time > 0) {
              cleanedExGoal.time = exGoal.time;
            }
            if (exGoal.steps !== undefined && exGoal.steps > 0) {
              cleanedExGoal.steps = exGoal.steps;
            }
            
            if (Object.keys(cleanedExGoal).length > 0) {
                goalsToSave[exId] = cleanedExGoal;
            }
        }
    });
    onSave({ date, goals: goalsToSave, skipped });
  };
  
  const handleRestDayClick = () => {
    const allExerciseIds = exercises.map(ex => ex.id);
    const currentlyAllSkipped = allExerciseIds.every(id => skipped.has(id));

    if (currentlyAllSkipped) {
        setSkipped(new Set());
        const restoredGoals: StudentGoal = {};
        exercises.forEach(ex => {
            const initialGoal = initialGoals[ex.id] || {};
            let specificGoal: ExerciseGoal = {};
            if (ex.category === 'count_time') {
              if (ex.countUnit) {
                specificGoal.count = initialGoal.count ?? ex.defaultCount ?? 0;
              }
              if (ex.timeUnit) {
                specificGoal.time = initialGoal.time ?? ex.defaultTime ?? 0;
              }
            } else if (ex.category === 'steps_distance') {
              if (ex.stepsUnit) {
                specificGoal.steps = initialGoal.steps ?? ex.defaultSteps ?? 0;
              }
            }
            restoredGoals[ex.id] = specificGoal;
        });
        setGoals(restoredGoals);
    } else {
        setSkipped(new Set(allExerciseIds));
    }
  };

  const allSkipped = exercises.length > 0 && exercises.every(ex => skipped.has(ex.id));

  if (!currentStudent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-2xl p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Target className="mr-2 h-6 w-6 text-primary" />
            {format(date, "M월 d일", { locale: ko })} 운동 목표 설정
          </DialogTitle>
          <DialogDescription>
            각 운동별 목표를 설정하거나, 오늘 하루 건너뛸 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {exercises && exercises.length > 0 ? (
            exercises.map(exercise => {
              const IconComponent = exercise.icon;
              const isSkipped = skipped.has(exercise.id);

              return (
                <div key={exercise.id} className="p-3 border rounded-lg shadow-sm bg-background">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-semibold text-primary flex items-center">
                      <IconComponent className="mr-2 h-5 w-5" /> {exercise.koreanName}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`skip-${exercise.id}`}
                        checked={isSkipped}
                        onCheckedChange={(checked) => handleSkipToggle(exercise.id, !!checked)}
                      />
                      <Label htmlFor={`skip-${exercise.id}`} className="text-xs font-normal text-muted-foreground cursor-pointer">
                        패스
                      </Label>
                    </div>
                  </div>
                  
                  {exercise.category === 'count_time' && (
                    <>
                      {exercise.countUnit && (
                        <div className="space-y-1 mt-2">
                          <Label htmlFor={`${exercise.id}-count`} className="text-xs">목표 ({exercise.countUnit})</Label>
                          <div className="flex items-center justify-center space-x-2 pt-1">
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => handleValueChange(exercise.id, 'count', -1)} disabled={isSkipped}>
                              <MinusCircle className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <span className={cn("text-2xl font-bold w-20 text-center tabular-nums", isSkipped && "text-muted-foreground/50")}>
                              {isSkipped ? 0 : (goals[exercise.id]?.count ?? 0)}
                            </span>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => handleValueChange(exercise.id, 'count', 1)} disabled={isSkipped}>
                              <PlusCircle className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {exercise.timeUnit && (
                        <div className="space-y-1 mt-2">
                          <Label htmlFor={`${exercise.id}-time`} className="text-xs">목표 ({exercise.timeUnit})</Label>
                          <div className="flex items-center justify-center space-x-2 pt-1">
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => handleValueChange(exercise.id, 'time', -1)} disabled={isSkipped}>
                              <MinusCircle className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <span className={cn("text-2xl font-bold w-20 text-center tabular-nums", isSkipped && "text-muted-foreground/50")}>
                              {isSkipped ? 0 : (goals[exercise.id]?.time ?? 0)}
                            </span>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => handleValueChange(exercise.id, 'time', 1)} disabled={isSkipped}>
                              <PlusCircle className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {exercise.category === 'steps_distance' && exercise.stepsUnit && (
                    <div className="space-y-1 mt-2">
                      <Label htmlFor={`${exercise.id}-steps`} className="text-xs">목표 ({exercise.stepsUnit})</Label>
                      <div className="flex items-center justify-center space-x-2 pt-1">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => handleValueChange(exercise.id, 'steps', -1)} disabled={isSkipped}>
                          <MinusCircle className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <span className={cn("text-2xl font-bold w-20 text-center tabular-nums", isSkipped && "text-muted-foreground/50")}>
                          {isSkipped ? 0 : (goals[exercise.id]?.steps ?? 0)}
                        </span>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => handleValueChange(exercise.id, 'steps', 1)} disabled={isSkipped}>
                          <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center">운동 목록이 아직 설정되지 않았습니다.</p>
          )}
        </div>
        
        <div className="px-6 pb-4 pt-4 border-t">
          <Button
            variant={allSkipped ? "default" : "secondary"}
            className="w-full"
            onClick={handleRestDayClick}
          >
            {allSkipped ? (
              <>
                <Check className="mr-2 h-5 w-5" /> 휴식 취소하기
              </>
            ) : (
              <>
                <Waves className="mr-2 h-5 w-5" /> 이날은 휴식할래요
              </>
            )}
          </Button>
        </div>

        <DialogFooter className="p-6 pt-0 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg">
              <X className="mr-2 h-5 w-5" /> 취소
            </Button>
          </DialogClose>
          <Button onClick={handleDialogSave} className="py-3 text-base rounded-lg">
            <Save className="mr-2 h-5 w-5" /> 목표 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SetStudentGoalsDialog;
