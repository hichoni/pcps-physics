
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Exercise, Student, StudentGoal, ExerciseGoal } from '@/lib/types';
import { Target, Save, X, PlusCircle, MinusCircle } from 'lucide-react';

interface SetStudentGoalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: StudentGoal) => void;
  exercises: Exercise[]; 
  currentStudent: Student | null;
  initialGoals: StudentGoal;
}

const SetStudentGoalsDialog: React.FC<SetStudentGoalsDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  exercises, 
  currentStudent, 
  initialGoals 
}) => {
  const [goals, setGoals] = useState<StudentGoal>({});

  useEffect(() => {
    if (isOpen) {
      const newGoalsState: StudentGoal = {};
      exercises.forEach(ex => {
        const initialGoal = initialGoals[ex.id];
        let specificGoal: ExerciseGoal = {};

        if (ex.id === 'squat' || ex.id === 'jump_rope') {
            specificGoal.count = initialGoal?.count ?? ex.defaultCount ?? 0;
        } else if (ex.id === 'plank') {
            specificGoal.time = initialGoal?.time ?? ex.defaultTime ?? 0;
        } else if (ex.id === 'walk_run') {
            specificGoal.steps = initialGoal?.steps ?? ex.defaultSteps ?? 0;
        }
        newGoalsState[ex.id] = specificGoal;
      });
      setGoals(newGoalsState);
    }
  }, [isOpen, exercises, initialGoals]);

  const handleValueChange = (exerciseId: string, field: keyof ExerciseGoal, delta: number) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    let step = 1;
    if (field === 'count') step = exercise.countStep || 1;
    else if (field === 'time') step = exercise.timeStep || 1;
    else if (field === 'steps') step = exercise.stepsStep || 1;
    
    setGoals(prevGoals => {
      const currentVal = prevGoals[exerciseId]?.[field] ?? 0;
      const newVal = Math.max(0, currentVal + (delta * step));

      // Create a new goal object ensuring only one metric is active
      const newGoalState: ExerciseGoal = {};
      if (field === 'count') newGoalState.count = newVal;
      else if (field === 'time') newGoalState.time = newVal;
      else if (field === 'steps') newGoalState.steps = newVal;

      return {
        ...prevGoals,
        [exerciseId]: newGoalState,
      };
    });
  };

  const handleDialogSave = () => {
    const cleanedGoals: StudentGoal = {};
    for (const exId in goals) {
      const exGoal = goals[exId];
      const cleanedExGoal: ExerciseGoal = {};
      if (exGoal.count !== undefined && exGoal.count > 0) cleanedExGoal.count = exGoal.count;
      else if (exGoal.time !== undefined && exGoal.time > 0) cleanedExGoal.time = exGoal.time;
      else if (exGoal.steps !== undefined && exGoal.steps > 0) cleanedExGoal.steps = exGoal.steps;
      
      if (Object.keys(cleanedExGoal).length > 0) {
        cleanedGoals[exId] = cleanedExGoal;
      }
    }
    onSave(cleanedGoals);
  };
  
  if (!currentStudent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Target className="mr-2 h-6 w-6 text-primary" />
            {currentStudent.name} 학생 운동 목표 설정
          </DialogTitle>
          <DialogDescription>
            각 운동별 목표를 설정해주세요. 0으로 설정하면 목표에서 제외됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {exercises && exercises.length > 0 ? (
            exercises.map(exercise => {
              const IconComponent = exercise.icon; 
              let unit: string | undefined;
              let field: keyof ExerciseGoal | undefined;
              let value: number | undefined;

              if (exercise.id === 'squat' || exercise.id === 'jump_rope') {
                unit = exercise.countUnit;
                field = 'count';
                value = goals[exercise.id]?.count;
              } else if (exercise.id === 'plank') {
                unit = exercise.timeUnit;
                field = 'time';
                value = goals[exercise.id]?.time;
              } else if (exercise.id === 'walk_run') {
                unit = exercise.stepsUnit;
                field = 'steps';
                value = goals[exercise.id]?.steps;
              }

              if (!field || !unit) return null;

              return (
                <div key={exercise.id} className="p-4 border rounded-lg shadow-sm bg-secondary/20">
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center">
                    <IconComponent className="mr-2 h-5 w-5" /> {exercise.koreanName}
                  </h3>
                  <div className="space-y-1">
                    <Label htmlFor={`${exercise.id}-${field}`} className="text-sm">목표 ({unit})</Label>
                    <div className="flex items-center justify-center space-x-4 pt-2">
                      <Button variant="ghost" size="icon" onClick={() => handleValueChange(exercise.id, field!, -1)}>
                        <MinusCircle className="h-8 w-8 text-primary" />
                      </Button>
                      <span className="text-3xl font-bold w-24 text-center tabular-nums">{value ?? 0}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleValueChange(exercise.id, field!, 1)}>
                        <PlusCircle className="h-8 w-8 text-primary" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center">운동 목록이 아직 설정되지 않았습니다.</p>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
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
