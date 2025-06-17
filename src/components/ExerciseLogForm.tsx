import type React from 'react';
import { useState, useEffect } from 'react';
import type { Student, Exercise, RecordedExercise, ClassName } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EXERCISES } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, MinusCircle, Save } from "lucide-react";
import { format } from "date-fns";

interface ExerciseLogFormProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<RecordedExercise, 'id'>) => void;
  recordedExercises: RecordedExercise[];
}

const ExerciseLogForm: React.FC<ExerciseLogFormProps> = ({ student, isOpen, onClose, onSave, recordedExercises }) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISES[0].id);
  const [logValue, setLogValue] = useState<number>(EXERCISES[0].defaultLogValue);
  const [logDate, setLogDate] = useState<Date>(new Date());

  const selectedExercise = EXERCISES.find(ex => ex.id === selectedExerciseId) || EXERCISES[0];

  useEffect(() => {
    if (student) {
      // Reset form when student changes or form opens
      setSelectedExerciseId(EXERCISES[0].id);
      setLogValue(EXERCISES[0].defaultLogValue);
      setLogDate(new Date());
    }
  }, [student, isOpen]);

  useEffect(() => {
    const currentExercise = EXERCISES.find(ex => ex.id === selectedExerciseId);
    if (currentExercise) {
      setLogValue(currentExercise.defaultLogValue);
    }
  }, [selectedExerciseId]);


  const handleSave = () => {
    if (!student) return;
    onSave({
      studentId: student.id,
      exerciseId: selectedExercise.id,
      date: format(logDate, "yyyy-MM-dd"),
      value: logValue,
      className: student.class as ClassName,
    });
    onClose();
  };

  if (!student) return null;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const exercisesLoggedTodayForStudent = recordedExercises.filter(
    rec => rec.studentId === student.id && rec.date === todayStr && rec.exerciseId === selectedExercise.id
  );
  const totalLoggedTodayForExercise = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + rec.value, 0);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline">Log Exercise for {student.name}</DialogTitle>
          <DialogDescription>
            Select an exercise, adjust the value, and choose the date.
          </DialogDescription>
        </DialogHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium block mb-2">Exercise Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EXERCISES.map((exercise) => (
                <Button
                  key={exercise.id}
                  variant={selectedExerciseId === exercise.id ? "default" : "outline"}
                  onClick={() => setSelectedExerciseId(exercise.id)}
                  className="h-auto py-3 flex flex-col items-center justify-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                  aria-pressed={selectedExerciseId === exercise.id}
                >
                  <exercise.icon className={cn("h-8 w-8 mb-1", selectedExerciseId === exercise.id ? "text-primary-foreground" : "text-primary")} />
                  <span>{exercise.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              {selectedExercise.name} ({selectedExercise.unit})
            </label>
            <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
              <Button variant="ghost" size="icon" onClick={() => setLogValue(Math.max(selectedExercise.step, logValue - selectedExercise.step))} aria-label="Decrease value">
                <MinusCircle className="h-8 w-8 text-primary" />
              </Button>
              <span className="text-4xl font-bold w-20 text-center">{logValue}</span>
              <Button variant="ghost" size="icon" onClick={() => setLogValue(logValue + selectedExercise.step)} aria-label="Increase value">
                <PlusCircle className="h-8 w-8 text-primary" />
              </Button>
            </div>
            {totalLoggedTodayForExercise > 0 && (
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                    Total {selectedExercise.name} logged today: {totalLoggedTodayForExercise} {selectedExercise.unit}
                </p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-2">Date</label>
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
                  {logDate ? format(logDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-lg">
                <Calendar
                  mode="single"
                  selected={logDate}
                  onSelect={(date) => date && setLogDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} className="py-3 text-base rounded-lg">
            <Save className="mr-2 h-5 w-5" /> Save Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseLogForm;

