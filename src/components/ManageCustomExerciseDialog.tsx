
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomExercise, ExerciseCategory } from "@/lib/types";
import { Save, Settings2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { iconMap } from '@/lib/iconMap'; 

interface ManageCustomExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: CustomExercise | Omit<CustomExercise, 'id'>) => void;
  exerciseToEdit?: CustomExercise | null;
}

const initialExerciseState: Omit<CustomExercise, 'id'> = {
  koreanName: '',
  iconName: 'Dumbbell',
  category: 'count_time',
  countUnit: '회',
  defaultCount: 10,
  countStep: 1,
  timeUnit: '초',
  defaultTime: 10,
  timeStep: 5,
  stepsUnit: '걸음',
  defaultSteps: 100,
  stepsStep: 50,
  dataAiHint: '',
};

const ManageCustomExerciseDialog: React.FC<ManageCustomExerciseDialogProps> = ({ isOpen, onClose, onSave, exerciseToEdit }) => {
  const [exerciseData, setExerciseData] = useState<Omit<CustomExercise, 'id'>>(initialExerciseState);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>('count_time');

  useEffect(() => {
    if (isOpen) {
      if (exerciseToEdit) {
        setExerciseData({
          koreanName: exerciseToEdit.koreanName,
          iconName: exerciseToEdit.iconName,
          category: exerciseToEdit.category,
          countUnit: exerciseToEdit.countUnit,
          defaultCount: exerciseToEdit.defaultCount,
          countStep: exerciseToEdit.countStep,
          timeUnit: exerciseToEdit.timeUnit,
          defaultTime: exerciseToEdit.defaultTime,
          timeStep: exerciseToEdit.timeStep,
          stepsUnit: exerciseToEdit.stepsUnit,
          defaultSteps: exerciseToEdit.defaultSteps,
          stepsStep: exerciseToEdit.stepsStep,
          dataAiHint: exerciseToEdit.dataAiHint || '',
        });
        setSelectedCategory(exerciseToEdit.category);
      } else {
        setExerciseData(initialExerciseState);
        setSelectedCategory('count_time');
      }
    }
  }, [isOpen, exerciseToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numFields = ['defaultCount', 'countStep', 'defaultTime', 'timeStep', 'defaultSteps', 'stepsStep'];
    if (numFields.includes(name)) {
      setExerciseData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setExerciseData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleIconNameChange = (value: string) => {
    setExerciseData(prev => ({ ...prev, iconName: value }));
  };

  const handleCategoryChange = (value: ExerciseCategory) => {
    setSelectedCategory(value);
    setExerciseData(prev => ({ ...prev, category: value }));
  };

  const handleSave = () => {
    if (!exerciseData.koreanName.trim() || !exerciseData.iconName.trim()) {
      alert("운동 이름과 아이콘 이름은 필수입니다.");
      return;
    }
    
    let finalData: Omit<CustomExercise, 'id'> = {
        ...exerciseData,
        countUnit: selectedCategory === 'count_time' ? exerciseData.countUnit : undefined,
        defaultCount: selectedCategory === 'count_time' ? exerciseData.defaultCount : undefined,
        countStep: selectedCategory === 'count_time' ? exerciseData.countStep : undefined,
        timeUnit: selectedCategory === 'count_time' ? exerciseData.timeUnit : undefined,
        defaultTime: selectedCategory === 'count_time' ? exerciseData.defaultTime : undefined,
        timeStep: selectedCategory === 'count_time' ? exerciseData.timeStep : undefined,
        stepsUnit: selectedCategory === 'steps_distance' ? exerciseData.stepsUnit : undefined,
        defaultSteps: selectedCategory === 'steps_distance' ? exerciseData.defaultSteps : undefined,
        stepsStep: selectedCategory === 'steps_distance' ? exerciseData.stepsStep : undefined,
    };
    
    // Make sure at least one metric is set for count_time
    if (selectedCategory === 'count_time' && !finalData.countUnit && !finalData.timeUnit) {
        alert("횟수/시간 기반 운동은 '횟수 단위' 또는 '시간 단위' 중 하나 이상을 입력해야 합니다.");
        return;
    }

    if (exerciseToEdit) {
      onSave({ ...finalData, id: exerciseToEdit.id });
    } else {
      onSave(finalData);
    }
  };
  
  const availableIconNames = Object.keys(iconMap).sort();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Settings2 className="mr-2 h-6 w-6 text-primary" />
            {exerciseToEdit ? `"${exerciseToEdit.koreanName}" 운동 수정` : '새 운동 추가'}
          </DialogTitle>
          <DialogDescription>
            {exerciseToEdit ? '운동의 세부 정보를 수정해주세요.' : '새로운 운동의 정보를 입력해주세요.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-6 border-t border-b">
          <div className="space-y-4">
            <div>
              <Label htmlFor="koreanName">운동 이름</Label>
              <Input id="koreanName" name="koreanName" value={exerciseData.koreanName} onChange={handleChange} placeholder="예: 스쿼트" />
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
              <Select value={selectedCategory} onValueChange={handleCategoryChange} disabled={!!exerciseToEdit}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="운동 종류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count_time">횟수 / 시간 기반</SelectItem>
                  <SelectItem value="steps_distance">걸음 기반</SelectItem>
                </SelectContent>
              </Select>
               {!!exerciseToEdit && <p className="text-xs text-muted-foreground mt-1">기존 운동의 카테고리는 변경할 수 없습니다.</p>}
            </div>

            {selectedCategory === 'count_time' && (
              <>
                <p className="text-sm font-medium text-muted-foreground pt-2">횟수 또는 시간 정보 (하나 이상 입력)</p>
                <div className="grid grid-cols-3 gap-2 items-end border p-3 rounded-md">
                  <div className="col-span-1"><Label htmlFor="countUnit">횟수 단위</Label><Input id="countUnit" name="countUnit" value={exerciseData.countUnit || ''} onChange={handleChange} placeholder="예: 회" /></div>
                  <div className="col-span-1"><Label htmlFor="defaultCount">기본값</Label><Input id="defaultCount" name="defaultCount" type="number" value={exerciseData.defaultCount ?? ''} onChange={handleChange} placeholder="예: 10" /></div>
                  <div className="col-span-1"><Label htmlFor="countStep">증가폭</Label><Input id="countStep" name="countStep" type="number" value={exerciseData.countStep ?? ''} onChange={handleChange} placeholder="예: 1" /></div>
                </div>
                <div className="grid grid-cols-3 gap-2 items-end border p-3 rounded-md">
                  <div className="col-span-1"><Label htmlFor="timeUnit">시간 단위</Label><Input id="timeUnit" name="timeUnit" value={exerciseData.timeUnit || ''} onChange={handleChange} placeholder="예: 초" /></div>
                  <div className="col-span-1"><Label htmlFor="defaultTime">기본값</Label><Input id="defaultTime" name="defaultTime" type="number" value={exerciseData.defaultTime ?? ''} onChange={handleChange} placeholder="예: 30" /></div>
                  <div className="col-span-1"><Label htmlFor="timeStep">증가폭</Label><Input id="timeStep" name="timeStep" type="number" value={exerciseData.timeStep ?? ''} onChange={handleChange} placeholder="예: 10" /></div>
                </div>
              </>
            )}

            {selectedCategory === 'steps_distance' && (
              <>
                <p className="text-sm font-medium text-muted-foreground pt-2">걸음 정보</p>
                <div className="grid grid-cols-3 gap-2 items-end border p-3 rounded-md">
                  <div className="col-span-1"><Label htmlFor="stepsUnit">걸음 단위</Label><Input id="stepsUnit" name="stepsUnit" value={exerciseData.stepsUnit || ''} onChange={handleChange} placeholder="예: 걸음" /></div>
                  <div className="col-span-1"><Label htmlFor="defaultSteps">기본값</Label><Input id="defaultSteps" name="defaultSteps" type="number" value={exerciseData.defaultSteps ?? ''} onChange={handleChange} placeholder="예: 1000" /></div>
                  <div className="col-span-1"><Label htmlFor="stepsStep">증가폭</Label><Input id="stepsStep" name="stepsStep" type="number" value={exerciseData.stepsStep ?? ''} onChange={handleChange} placeholder="예: 100" /></div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="dataAiHint">AI 이미지 힌트 (영어, 1-2 단어)</Label>
              <Input id="dataAiHint" name="dataAiHint" value={exerciseData.dataAiHint} onChange={handleChange} placeholder="예: child squat" />
              <p className="text-xs text-muted-foreground mt-1">
                학생용 앱에서 이미지 첨부 없이 기록 시 사용될 플레이스홀더 이미지 생성에 사용됩니다.
              </p>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg"><X className="mr-2 h-5 w-5" /> 취소</Button>
          </DialogClose>
          <Button onClick={handleSave} className="py-3 text-base rounded-lg"><Save className="mr-2 h-5 w-5" /> 저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageCustomExerciseDialog;
