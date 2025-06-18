
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea"; // Not needed for fixed exercises
import type { CustomExercise, ExerciseCategory } from "@/lib/types";
import { Save, Settings2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { iconMap } from '@/lib/iconMap'; 

interface ManageCustomExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: CustomExercise) => void;
  exerciseToEdit?: CustomExercise | null;
}

// This initial state is less relevant now as we edit fixed exercises
const initialExerciseState: Omit<CustomExercise, 'id'> = {
  koreanName: '',
  iconName: '',
  category: 'count_time', // Default, will be overridden by exerciseToEdit
  countUnit: undefined,
  defaultCount: undefined,
  countStep: undefined,
  timeUnit: undefined,
  defaultTime: undefined,
  timeStep: undefined,
  stepsUnit: undefined,
  defaultSteps: undefined,
  stepsStep: undefined,
  distanceUnit: undefined,
  defaultDistance: undefined,
  distanceStep: undefined,
  dataAiHint: '',
};

const ManageCustomExerciseDialog: React.FC<ManageCustomExerciseDialogProps> = ({ isOpen, onClose, onSave, exerciseToEdit }) => {
  const [exerciseData, setExerciseData] = useState<Omit<CustomExercise, 'id'>>(initialExerciseState);
  // Selected category is now fixed by exerciseToEdit
  // const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('count_time');

  useEffect(() => {
    if (isOpen) {
      if (exerciseToEdit) {
        setExerciseData({
          koreanName: exerciseToEdit.koreanName, // Non-editable for fixed exercises
          iconName: exerciseToEdit.iconName,
          category: exerciseToEdit.category, // Non-editable
          countUnit: exerciseToEdit.countUnit,
          defaultCount: exerciseToEdit.defaultCount,
          countStep: exerciseToEdit.countStep,
          timeUnit: exerciseToEdit.timeUnit,
          defaultTime: exerciseToEdit.defaultTime,
          timeStep: exerciseToEdit.timeStep,
          // stepsUnit and distanceUnit fields are for specific exercises
          stepsUnit: exerciseToEdit.stepsUnit,
          defaultSteps: exerciseToEdit.defaultSteps,
          stepsStep: exerciseToEdit.stepsStep,
          distanceUnit: exerciseToEdit.distanceUnit,
          defaultDistance: exerciseToEdit.defaultDistance,
          distanceStep: exerciseToEdit.distanceStep,
          dataAiHint: exerciseToEdit.dataAiHint || '',
        });
        // setSelectedCategory(exerciseToEdit.category); // Not needed
      } else {
        // Adding new exercises is disabled in the UI, so this path is less likely
        setExerciseData(initialExerciseState);
        // setSelectedCategory('count_time');
      }
    }
  }, [isOpen, exerciseToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numFields = ['defaultCount', 'countStep', 'defaultTime', 'timeStep', 'defaultSteps', 'stepsStep', 'defaultDistance', 'distanceStep'];
    if (numFields.includes(name)) {
      setExerciseData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setExerciseData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleIconNameChange = (value: string) => {
    setExerciseData(prev => ({ ...prev, iconName: value }));
  };

  const handleSave = () => {
    if (!exerciseData.koreanName.trim() || !exerciseData.iconName.trim()) {
      alert("운동 이름과 아이콘 이름은 필수입니다."); // Should not happen if KoreanName is non-editable
      return;
    }
    if (!exerciseToEdit) {
        alert("수정할 운동 정보가 없습니다."); // Safety check
        return;
    }
    
    // Reconstruct the exercise with only relevant fields for its type
    const finalExerciseData: CustomExercise = {
        id: exerciseToEdit.id, 
        koreanName: exerciseToEdit.koreanName, // Use original name from exerciseToEdit
        iconName: exerciseData.iconName,
        category: exerciseToEdit.category, // Use original category
        dataAiHint: exerciseData.dataAiHint,

        countUnit: exerciseToEdit.id === 'squat' || exerciseToEdit.id === 'jump_rope' ? exerciseData.countUnit : undefined,
        defaultCount: exerciseToEdit.id === 'squat' || exerciseToEdit.id === 'jump_rope' ? exerciseData.defaultCount : undefined,
        countStep: exerciseToEdit.id === 'squat' || exerciseToEdit.id === 'jump_rope' ? exerciseData.countStep : undefined,
        
        timeUnit: exerciseToEdit.id === 'plank' ? exerciseData.timeUnit : undefined,
        defaultTime: exerciseToEdit.id === 'plank' ? exerciseData.defaultTime : undefined,
        timeStep: exerciseToEdit.id === 'plank' ? exerciseData.timeStep : undefined,
        
        distanceUnit: exerciseToEdit.id === 'walk_run' ? exerciseData.distanceUnit : undefined,
        defaultDistance: exerciseToEdit.id === 'walk_run' ? exerciseData.defaultDistance : undefined,
        distanceStep: exerciseToEdit.id === 'walk_run' ? exerciseData.distanceStep : undefined,

        // Ensure other category fields are undefined
        stepsUnit: undefined,
        defaultSteps: undefined,
        stepsStep: undefined,
        ...(exerciseToEdit.id !== 'squat' && exerciseToEdit.id !== 'jump_rope' && {countUnit: undefined, defaultCount: undefined, countStep: undefined}),
        ...(exerciseToEdit.id !== 'plank' && {timeUnit: undefined, defaultTime: undefined, timeStep: undefined}),
        ...(exerciseToEdit.id !== 'walk_run' && {distanceUnit: undefined, defaultDistance: undefined, distanceStep: undefined}),

    };
    onSave(finalExerciseData);
  };
  
  const availableIconNames = Object.keys(iconMap).sort();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Settings2 className="mr-2 h-6 w-6 text-primary" />
            {exerciseToEdit ? `"${exerciseToEdit.koreanName}" 운동 수정` : '운동 수정'}
          </DialogTitle>
          <DialogDescription>
            운동의 세부 정보를 수정해주세요. 운동 이름과 종류는 고정됩니다.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-6 border-t border-b">
         {exerciseToEdit ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="koreanName">운동 이름</Label>
              <Input id="koreanName" name="koreanName" value={exerciseToEdit.koreanName} disabled className="bg-muted/50" />
            </div>
            <div>
              <Label htmlFor="iconName">아이콘 이름 (Lucide)</Label>
              <Select value={exerciseData.iconName} onValueChange={handleIconNameChange}>
                <SelectTrigger id="iconName">
                  <SelectValue placeholder="아이콘을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableIconNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                사용 가능한 아이콘 목록: <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev/icons</a> 참조.
              </p>
            </div>
            <div>
              <Label htmlFor="category">운동 카테고리</Label>
              <Input id="category" name="category" value={
                  exerciseToEdit.category === 'count_time' ? '횟수/시간 기반' : '걸음/거리 기반'
              } disabled className="bg-muted/50" />
            </div>

            {(exerciseToEdit.id === 'squat' || exerciseToEdit.id === 'jump_rope') && (
              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-1"><Label htmlFor="countUnit">단위</Label><Input id="countUnit" name="countUnit" value={exerciseData.countUnit || ''} onChange={handleChange} placeholder="예: 회" /></div>
                <div className="col-span-1"><Label htmlFor="defaultCount">기본값</Label><Input id="defaultCount" name="defaultCount" type="number" value={exerciseData.defaultCount ?? ''} onChange={handleChange} placeholder="예: 10" /></div>
                <div className="col-span-1"><Label htmlFor="countStep">증가폭</Label><Input id="countStep" name="countStep" type="number" value={exerciseData.countStep ?? ''} onChange={handleChange} placeholder="예: 1" /></div>
              </div>
            )}

            {exerciseToEdit.id === 'plank' && (
              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-1"><Label htmlFor="timeUnit">단위</Label><Input id="timeUnit" name="timeUnit" value={exerciseData.timeUnit || ''} onChange={handleChange} placeholder="예: 초" /></div>
                <div className="col-span-1"><Label htmlFor="defaultTime">기본값</Label><Input id="defaultTime" name="defaultTime" type="number" value={exerciseData.defaultTime ?? ''} onChange={handleChange} placeholder="예: 30" /></div>
                <div className="col-span-1"><Label htmlFor="timeStep">증가폭</Label><Input id="timeStep" name="timeStep" type="number" value={exerciseData.timeStep ?? ''} onChange={handleChange} placeholder="예: 10" /></div>
              </div>
            )}

            {exerciseToEdit.id === 'walk_run' && (
              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-1"><Label htmlFor="distanceUnit">단위</Label><Input id="distanceUnit" name="distanceUnit" value={exerciseData.distanceUnit || ''} onChange={handleChange} placeholder="예: m" /></div>
                <div className="col-span-1"><Label htmlFor="defaultDistance">기본값</Label><Input id="defaultDistance" name="defaultDistance" type="number" value={exerciseData.defaultDistance ?? ''} onChange={handleChange} placeholder="예: 500" /></div>
                <div className="col-span-1"><Label htmlFor="distanceStep">증가폭</Label><Input id="distanceStep" name="distanceStep" type="number" value={exerciseData.distanceStep ?? ''} onChange={handleChange} placeholder="예: 50" /></div>
              </div>
            )}
             <div>
              <Label htmlFor="dataAiHint">AI 이미지 힌트 (영어, 1-2 단어)</Label>
              <Input id="dataAiHint" name="dataAiHint" value={exerciseData.dataAiHint} onChange={handleChange} placeholder="예: child squat" />
              <p className="text-xs text-muted-foreground mt-1">
                학생용 앱에서 이미지 첨부 없이 기록 시 사용될 플레이스홀더 이미지 생성에 사용됩니다.
              </p>
            </div>
          </div>
          ) : (
            <p>수정할 운동을 선택해주세요.</p>
          )}
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg"><X className="mr-2 h-5 w-5" /> 취소</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!exerciseToEdit} className="py-3 text-base rounded-lg"><Save className="mr-2 h-5 w-5" /> 저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageCustomExerciseDialog;
