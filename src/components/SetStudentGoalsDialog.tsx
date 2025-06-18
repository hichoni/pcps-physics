
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Exercise, Student, StudentGoal, ExerciseGoal } from '@/lib/types';
import { Target, Save, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SetStudentGoalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goals: StudentGoal) => void;
  exercises: Exercise[]; // 교사가 설정한 운동 목록을 받도록 수정
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
      if (exercises && exercises.length > 0) {
        exercises.forEach(ex => {
          newGoalsState[ex.id] = {
            count: initialGoals[ex.id]?.count ?? undefined,
            time: initialGoals[ex.id]?.time ?? undefined,
            steps: initialGoals[ex.id]?.steps ?? undefined,
            distance: initialGoals[ex.id]?.distance ?? undefined,
          };
        });
      }
      setGoals(newGoalsState);
    }
  }, [isOpen, exercises, initialGoals]);

  const handleInputChange = (exerciseId: string, field: keyof ExerciseGoal, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    if (value !== '' && (isNaN(numValue) || numValue < 0)) return; 

    setGoals(prevGoals => ({
      ...prevGoals,
      [exerciseId]: {
        ...prevGoals[exerciseId],
        [field]: numValue,
      },
    }));
  };

  const handleDialogSave = () => {
    const cleanedGoals: StudentGoal = {};
    for (const exId in goals) {
      const exGoal = goals[exId];
      const cleanedExGoal: ExerciseGoal = {};
      if (exGoal.count !== undefined && exGoal.count > 0) cleanedExGoal.count = exGoal.count;
      if (exGoal.time !== undefined && exGoal.time > 0) cleanedExGoal.time = exGoal.time;
      if (exGoal.steps !== undefined && exGoal.steps > 0) cleanedExGoal.steps = exGoal.steps;
      if (exGoal.distance !== undefined && exGoal.distance > 0) cleanedExGoal.distance = exGoal.distance;
      
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
            각 운동별 목표를 설정해주세요. 비워두면 해당 항목은 목표에서 제외됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {exercises && exercises.length > 0 ? (
            exercises.map(exercise => {
              const IconComponent = exercise.icon as LucideIcon; // 명시적 타입 지정
              return (
                <div key={exercise.id} className="p-4 border rounded-lg shadow-sm bg-secondary/20">
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center">
                    <IconComponent className="mr-2 h-5 w-5" /> {exercise.koreanName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {exercise.category === 'count_time' && (
                      <>
                        {exercise.countUnit && (
                        <div className="space-y-1">
                          <Label htmlFor={`${exercise.id}-count`} className="text-sm">목표 횟수 ({exercise.countUnit})</Label>
                          <Input
                            id={`${exercise.id}-count`}
                            type="number"
                            min="0"
                            value={goals[exercise.id]?.count ?? ''}
                            onChange={(e) => handleInputChange(exercise.id, 'count', e.target.value)}
                            placeholder={`예: ${exercise.defaultCount ?? 10}`}
                            className="text-base py-2 rounded-md"
                          />
                        </div>
                        )}
                        {exercise.timeUnit && (
                        <div className="space-y-1">
                          <Label htmlFor={`${exercise.id}-time`} className="text-sm">목표 시간 ({exercise.timeUnit})</Label>
                          <Input
                            id={`${exercise.id}-time`}
                            type="number"
                            min="0"
                            step="0.5" 
                            value={goals[exercise.id]?.time ?? ''}
                            onChange={(e) => handleInputChange(exercise.id, 'time', e.target.value)}
                            placeholder={`예: ${exercise.defaultTime ?? 1}`}
                            className="text-base py-2 rounded-md"
                          />
                        </div>
                        )}
                      </>
                    )}
                    {exercise.category === 'steps_distance' && (
                      <>
                        {exercise.stepsUnit && (
                        <div className="space-y-1">
                          <Label htmlFor={`${exercise.id}-steps`} className="text-sm">목표 걸음 수 ({exercise.stepsUnit})</Label>
                          <Input
                            id={`${exercise.id}-steps`}
                            type="number"
                            min="0"
                            value={goals[exercise.id]?.steps ?? ''}
                            onChange={(e) => handleInputChange(exercise.id, 'steps', e.target.value)}
                            placeholder={`예: ${exercise.defaultSteps ?? 1000}`}
                            className="text-base py-2 rounded-md"
                          />
                        </div>
                        )}
                        {exercise.distanceUnit && (
                        <div className="space-y-1">
                          <Label htmlFor={`${exercise.id}-distance`} className="text-sm">목표 거리 ({exercise.distanceUnit})</Label>
                          <Input
                            id={`${exercise.id}-distance`}
                            type="number"
                            min="0"
                            value={goals[exercise.id]?.distance ?? ''}
                            onChange={(e) => handleInputChange(exercise.id, 'distance', e.target.value)}
                            placeholder={`예: ${exercise.defaultDistance ?? 500}`}
                            className="text-base py-2 rounded-md"
                          />
                        </div>
                        )}
                      </>
                    )}
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
