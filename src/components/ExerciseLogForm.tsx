
import type React from 'react';
import { useState, useEffect } from 'react';
import type { Student, Exercise, RecordedExercise, ClassName } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EXERCISES } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, MinusCircle, Save, Camera, UploadCloud, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ko } from 'date-fns/locale';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';


interface ExerciseLogFormProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<RecordedExercise, 'id'>) => void;
  recordedExercises: RecordedExercise[];
  onSwitchToCameraMode?: (exerciseId: string) => void;
}

const ExerciseLogForm: React.FC<ExerciseLogFormProps> = ({ student, isOpen, onClose, onSave, recordedExercises, onSwitchToCameraMode }) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(EXERCISES[0].id);

  const [countLogValue, setCountLogValue] = useState<number>(EXERCISES[0].defaultCount ?? 0);
  const [timeLogValue, setTimeLogValue] = useState<number>(EXERCISES[0].defaultTime ?? 0);

  const [stepsLogValue, setStepsLogValue] = useState<number>(EXERCISES[0].defaultSteps ?? 0);
  const [distanceLogValue, setDistanceLogValue] = useState<number>(EXERCISES[0].defaultDistance ?? 0);

  const [logDate, setLogDate] = useState<Date>(new Date());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { toast } = useToast();
  const selectedExercise = EXERCISES.find(ex => ex.id === selectedExerciseId) || EXERCISES[0];

  const resetFormState = () => {
    const currentEx = EXERCISES.find(ex => ex.id === selectedExerciseId) || EXERCISES[0];
    setSelectedExerciseId(currentEx.id);

    if (currentEx.category === 'count_time') {
      setCountLogValue(currentEx.defaultCount ?? 0);
      setTimeLogValue(currentEx.defaultTime ?? 0);
    } else if (currentEx.category === 'steps_distance') {
      setStepsLogValue(currentEx.defaultSteps ?? 0);
      setDistanceLogValue(currentEx.defaultDistance ?? 0);
    }
    setLogDate(new Date());
    setSelectedFile(null);
    setFilePreview(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  useEffect(() => {
    if (student && isOpen) {
      resetFormState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, isOpen]);

  useEffect(() => {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "파일 크기 초과", description: "이미지 파일은 5MB를 넘을 수 없습니다.", variant: "destructive" });
        setSelectedFile(null);
        setFilePreview(null);
        event.target.value = "";
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleSave = async () => {
    if (!student || !selectedExercise) return;

    let imageUrl: string | undefined = undefined;

    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);

      if (!storage) {
        console.error("Firebase Storage is not initialized. Check firebase.ts and environment variables.");
        toast({
          title: "업로드 설정 오류",
          description: "파일 저장소(Storage)가 제대로 설정되지 않았습니다. 관리자에게 문의하세요.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      try {
        const timestamp = new Date().getTime();
        const uniqueFileName = `${timestamp}_${selectedFile.name}`;
        const filePath = `proofShots/${student.id}/${format(logDate, "yyyy-MM-dd")}/${selectedExercise.id}/${uniqueFileName}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, selectedFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error: any) => {
              console.error("Upload failed (Firebase Storage Error):", error, "Error Code:", error.code);
              let description = "이미지 업로드 중 오류가 발생했습니다.";
              if (error.code) {
                description += ` (오류 코드: ${error.code})`;
                if (error.code === 'storage/unauthorized') {
                    description = "이미지 업로드 권한이 없습니다. Firebase Storage 규칙을 확인해주세요. (오류 코드: storage/unauthorized)";
                } else if (error.code === 'storage/bucket-not-found') {
                    description = "저장소 버킷을 찾을 수 없습니다. Firebase 설정을 확인해주세요. (오류 코드: storage/bucket-not-found)";
                }
              }
              toast({
                title: "업로드 실패",
                description: description,
                variant: "destructive",
              });
              reject(error);
            },
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      } catch (error: any) {
        // This catch block will handle rejections from the promise (e.g., if toast was already shown by the error callback)
        // or other synchronous errors before the upload even starts.
        // The toast is likely already shown by the 'error' callback of uploadTask.on.
        // We just need to ensure the loading state is reset.
        setIsUploading(false);
        setUploadProgress(0);
        return; // Stop further execution
      }
      // If upload was successful, reset loading state
      setIsUploading(false);
      setUploadProgress(0);
    }

    let logEntry: Omit<RecordedExercise, 'id'> = {
      studentId: student.id,
      exerciseId: selectedExercise.id,
      date: format(logDate, "yyyy-MM-dd"),
      className: student.class as ClassName,
      ...(imageUrl && { imageUrl }),
    };

    if (selectedExercise.category === 'count_time') {
      logEntry.countValue = countLogValue;
      logEntry.timeValue = timeValue;
    } else if (selectedExercise.category === 'steps_distance') {
      logEntry.stepsValue = stepsLogValue;
      logEntry.distanceValue = distanceLogValue;
    }

    onSave(logEntry);
    onClose();
  };

  if (!student) return null;

  const todayStr = format(logDate, "yyyy-MM-dd");
  const exercisesLoggedTodayForStudent = recordedExercises.filter(
    rec => rec.studentId === student.id && rec.date === todayStr && rec.exerciseId === selectedExercise.id
  );

  let totalLoggedTodayDisplay = "";
  if (selectedExercise.category === 'count_time') {
    const totalCount = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.countValue || 0), 0);
    const totalTime = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.timeValue || 0), 0);
    if (totalCount > 0 || totalTime > 0) {
      let displayParts = [];
      if (selectedExercise.countUnit && totalCount > 0) displayParts.push(`${totalCount}${selectedExercise.countUnit}`);
      if (selectedExercise.timeUnit && totalTime > 0) displayParts.push(`${totalTime}${selectedExercise.timeUnit}`);
      if (displayParts.length > 0) {
        totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${displayParts.join(', ')}`;
      }
    }
  } else if (selectedExercise.category === 'steps_distance') {
    const totalSteps = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.stepsValue || 0), 0);
    const totalDistance = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.distanceValue || 0), 0);
    if (totalSteps > 0 || totalDistance > 0) {
      let displayParts = [];
      if (selectedExercise.stepsUnit && totalSteps > 0) displayParts.push(`${totalSteps}${selectedExercise.stepsUnit}`);
      if (selectedExercise.distanceUnit && totalDistance > 0) displayParts.push(`${totalDistance}${selectedExercise.distanceUnit}`);
      if (displayParts.length > 0) {
        totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${displayParts.join(', ')}`;
      }
    }
  }

  const canUseCameraForExercise = selectedExercise.id === 'ex4' && onSwitchToCameraMode;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetFormState(); } }}>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline">{student.name} 학생 운동 기록</DialogTitle>
          <DialogDescription>
            운동을 선택하고, 값을 조절한 후 날짜와 인증샷을 추가하세요.
          </DialogDescription>
        </DialogHeader>
        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
                  disabled={isUploading}
                >
                  <exercise.icon className={cn("h-8 w-8 mb-1", selectedExerciseId === exercise.id ? "text-primary-foreground" : "text-primary")} />
                  <span>{exercise.koreanName}</span>
                </Button>
              ))}
            </div>
          </div>

          {selectedExercise.category === 'count_time' && (
            <>
              {selectedExercise.countUnit && (
                <div>
                  <label className="text-sm font-medium block mb-2">
                    {selectedExercise.koreanName} ({selectedExercise.countUnit})
                  </label>
                  <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => setCountLogValue(Math.max(0, countLogValue - (selectedExercise.countStep ?? 1)))} aria-label="횟수 감소" disabled={isUploading}>
                      <MinusCircle className="h-8 w-8 text-primary" />
                    </Button>
                    <span className="text-4xl font-bold w-20 text-center">{countLogValue}</span>
                    <Button variant="ghost" size="icon" onClick={() => setCountLogValue(countLogValue + (selectedExercise.countStep ?? 1))} aria-label="횟수 증가" disabled={isUploading}>
                      <PlusCircle className="h-8 w-8 text-primary" />
                    </Button>
                  </div>
                </div>
              )}
              {selectedExercise.timeUnit && (
                <div>
                  <label className="text-sm font-medium block mb-2">
                    {selectedExercise.koreanName} ({selectedExercise.timeUnit})
                  </label>
                  <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => setTimeLogValue(Math.max(0, timeValue - (selectedExercise.timeStep ?? 1)))} aria-label="시간 감소" disabled={isUploading}>
                      <MinusCircle className="h-8 w-8 text-primary" />
                    </Button>
                    <span className="text-4xl font-bold w-20 text-center">{timeLogValue}</span>
                    <Button variant="ghost" size="icon" onClick={() => setTimeLogValue(timeValue + (selectedExercise.timeStep ?? 1))} aria-label="시간 증가" disabled={isUploading}>
                      <PlusCircle className="h-8 w-8 text-primary" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {selectedExercise.category === 'steps_distance' && (
            <>
              {selectedExercise.stepsUnit && (
                <div>
                  <label className="text-sm font-medium block mb-2">
                    {selectedExercise.koreanName} ({selectedExercise.stepsUnit})
                  </label>
                  <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => setStepsLogValue(Math.max(0, stepsLogValue - (selectedExercise.stepsStep ?? 1)))} aria-label="걸음 수 감소" disabled={isUploading}>
                      <MinusCircle className="h-8 w-8 text-primary" />
                    </Button>
                    <span className="text-4xl font-bold w-20 text-center">{stepsLogValue}</span>
                    <Button variant="ghost" size="icon" onClick={() => setStepsLogValue(stepsLogValue + (selectedExercise.stepsStep ?? 1))} aria-label="걸음 수 증가" disabled={isUploading}>
                      <PlusCircle className="h-8 w-8 text-primary" />
                    </Button>
                  </div>
                </div>
              )}
              {selectedExercise.distanceUnit && (
                <div>
                  <label className="text-sm font-medium block mb-2">
                    {selectedExercise.koreanName} ({selectedExercise.distanceUnit})
                  </label>
                  <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => setDistanceLogValue(Math.max(0, distanceLogValue - (selectedExercise.distanceStep ?? 1)))} aria-label="거리 감소" disabled={isUploading}>
                      <MinusCircle className="h-8 w-8 text-primary" />
                    </Button>
                    <span className="text-4xl font-bold w-20 text-center">{distanceLogValue}</span>
                    <Button variant="ghost" size="icon" onClick={() => setDistanceLogValue(distanceLogValue + (selectedExercise.distanceStep ?? 1))} aria-label="거리 증가" disabled={isUploading}>
                      <PlusCircle className="h-8 w-8 text-primary" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          {totalLoggedTodayDisplay && (
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                    {totalLoggedTodayDisplay}
                </p>
            )}

          <div>
            <Label htmlFor="logDate" className="text-sm font-medium block mb-2">날짜</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="logDate"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 text-base rounded-lg",
                    !logDate && "text-muted-foreground"
                  )}
                  disabled={isUploading}
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
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="proofShot" className="text-sm font-medium block mb-2">인증샷 (선택, 5MB 이하)</Label>
            <Input
              id="proofShot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 rounded-lg"
              disabled={isUploading}
            />
            {filePreview && (
              <div className="mt-3 relative w-32 h-32 border rounded-md overflow-hidden shadow-sm mx-auto">
                <Image src={filePreview} alt="인증샷 미리보기" layout="fill" objectFit="cover" />
              </div>
            )}
            {isUploading && (
              <div className="mt-2 text-center">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-primary" />
                <span className="text-sm text-muted-foreground">업로드 중... {uploadProgress.toFixed(0)}%</span>
              </div>
            )}
          </div>

          {canUseCameraForExercise && (
            <Button
              variant="secondary"
              className="w-full py-3 text-base rounded-lg mt-4"
              onClick={() => onSwitchToCameraMode(selectedExercise.id)}
              disabled={isUploading}
            >
              <Camera className="mr-2 h-5 w-5" /> AI 카메라로 기록 (줄넘기)
            </Button>
          )}

        </CardContent>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg" disabled={isUploading}>취소</Button>
          </DialogClose>
          <Button onClick={handleSave} className="py-3 text-base rounded-lg" disabled={isUploading || ((selectedExercise.category === 'count_time' && countLogValue === 0 && timeLogValue === 0) || (selectedExercise.category === 'steps_distance' && stepsLogValue === 0 && distanceLogValue === 0) && !selectedFile) }>
            {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {isUploading ? '저장 중...' : '기록 저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseLogForm;
