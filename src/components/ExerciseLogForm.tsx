
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
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, MinusCircle, Save, Camera, UploadCloud, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from 'date-fns/locale';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
// import { getIconByName } from '@/lib/iconMap'; // Icon directly from Exercise type

interface ExerciseLogFormProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<RecordedExercise, 'id'>) => void;
  recordedExercises: RecordedExercise[];
  onSwitchToCameraMode?: (exerciseId: string) => void;
  availableExercises: Exercise[]; 
}

const ExerciseLogForm: React.FC<ExerciseLogFormProps> = ({ student, isOpen, onClose, onSave, recordedExercises, onSwitchToCameraMode, availableExercises }) => {
  const initialExercise = availableExercises.length > 0 ? availableExercises[0] : null;
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(initialExercise?.id || '');

  const [logValue, setLogValue] = useState<number>(0); // Single value for the selected metric

  const [logDate, setLogDate] = useState<Date>(new Date());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { toast } = useToast();
  const selectedExercise = availableExercises.find(ex => ex.id === selectedExerciseId) || initialExercise;

  // Helper to set initial log value based on exercise type
  const getInitialLogValue = (exercise: Exercise | null): number => {
    if (!exercise) return 0;
    if (exercise.id === 'squat' || exercise.id === 'jump_rope') return exercise.defaultCount ?? 0;
    if (exercise.id === 'plank') return exercise.defaultTime ?? 0;
    if (exercise.id === 'walk_run') return exercise.defaultDistance ?? 0;
    return 0;
  };
  
  const getStepValue = (exercise: Exercise | null): number => {
    if (!exercise) return 1;
    if (exercise.id === 'squat' || exercise.id === 'jump_rope') return exercise.countStep ?? 1;
    if (exercise.id === 'plank') return exercise.timeStep ?? 1;
    if (exercise.id === 'walk_run') return exercise.distanceStep ?? 1;
    return 1;
  };

  useEffect(() => {
    if (student && isOpen) {
      const currentEx = availableExercises.find(ex => ex.id === selectedExerciseId) || 
                        (availableExercises.length > 0 ? availableExercises[0] : null);
      if (currentEx && currentEx.id !== selectedExerciseId) {
        setSelectedExerciseId(currentEx.id);
      } else if (!currentEx && availableExercises.length > 0) {
        setSelectedExerciseId(availableExercises[0].id);
      } else if (availableExercises.length === 0) {
        setSelectedExerciseId('');
      }
      setLogValue(getInitialLogValue(currentEx));
      setLogDate(new Date());
      setSelectedFile(null);
      setFilePreview(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, isOpen, availableExercises]);

  useEffect(() => {
    const currentExerciseDetails = availableExercises.find(ex => ex.id === selectedExerciseId);
    setLogValue(getInitialLogValue(currentExerciseDetails || null));
  }, [selectedExerciseId, availableExercises]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
    if (!student || !selectedExercise) {
      toast({ title: "오류", description: "학생 정보 또는 운동이 선택되지 않았습니다.", variant: "destructive" });
      return;
    }
    if (logValue === 0 && !selectedFile) {
        toast({ title: "알림", description: "운동 기록 값이 0입니다. 값을 입력하거나 인증샷을 첨부해주세요.", variant: "default"});
        // Allow saving if image is present, even with 0 value
    }


    let imageUrl: string | undefined = undefined;

    if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(0);
      if (!storage) {
        console.error("Firebase Storage is not initialized.");
        toast({ title: "업로드 설정 오류", description: "파일 저장소(Storage)가 제대로 설정되지 않았습니다.", variant: "destructive"});
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
          uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          }, (error: any) => {
            console.error("Upload failed:", error);
            toast({ title: "업로드 실패", description: "이미지 업로드 중 오류가 발생했습니다.", variant: "destructive" });
            reject(error);
          }, async () => {
            try {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            } catch (getUrlError: any) {
              console.error("Get Download URL failed:", getUrlError);
              toast({ title: "URL 가져오기 실패", description: "업로드된 이미지의 URL을 가져오는 데 실패했습니다.", variant: "destructive" });
              reject(getUrlError);
            }
          });
        });
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
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

    if (selectedExercise.id === 'squat' || selectedExercise.id === 'jump_rope') {
      logEntry.countValue = logValue;
    } else if (selectedExercise.id === 'plank') {
      logEntry.timeValue = logValue;
    } else if (selectedExercise.id === 'walk_run') {
      logEntry.distanceValue = logValue;
    }

    onSave(logEntry);
    onClose(); 
  };

  if (!student || !selectedExercise) return null;
  if (availableExercises.length === 0) return null; 

  const todayStr = format(logDate, "yyyy-MM-dd");
  const exercisesLoggedTodayForStudent = recordedExercises.filter(
    rec => rec.studentId === student.id && rec.date === todayStr && rec.exerciseId === selectedExercise.id
  );

  let totalLoggedTodayDisplay = "";
  let currentUnit = "";
  if (selectedExercise.id === 'squat' || selectedExercise.id === 'jump_rope') {
    const totalCount = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.countValue || 0), 0);
    currentUnit = selectedExercise.countUnit || "";
    if (totalCount > 0) totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${totalCount}${currentUnit}`;
  } else if (selectedExercise.id === 'plank') {
    const totalTime = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.timeValue || 0), 0);
    currentUnit = selectedExercise.timeUnit || "";
    if (totalTime > 0) totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${totalTime}${currentUnit}`;
  } else if (selectedExercise.id === 'walk_run') {
    const totalDistance = exercisesLoggedTodayForStudent.reduce((sum, rec) => sum + (rec.distanceValue || 0), 0);
    currentUnit = selectedExercise.distanceUnit || "";
    if (totalDistance > 0) totalLoggedTodayDisplay = `오늘 총 ${selectedExercise.koreanName} 기록: ${totalDistance}${currentUnit}`;
  }
  
  const jumpRopeExercise = availableExercises.find(ex => ex.id === "jump_rope");
  const canUseCameraForExercise = selectedExercise.id === jumpRopeExercise?.id && onSwitchToCameraMode;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); } }}>
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
            {availableExercises.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {availableExercises.map((exercise) => {
                  const CurrentExIcon = exercise.icon;
                  return (
                    <Button
                      key={exercise.id}
                      variant={selectedExerciseId === exercise.id ? "default" : "outline"}
                      onClick={() => setSelectedExerciseId(exercise.id)}
                      className="h-auto py-3 flex flex-col items-center justify-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                      aria-pressed={selectedExerciseId === exercise.id}
                      disabled={isUploading}
                    >
                      <CurrentExIcon className={cn("h-8 w-8 mb-1", selectedExerciseId === exercise.id ? "text-primary-foreground" : "text-primary")} />
                      <span>{exercise.koreanName}</span>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">선생님께서 아직 운동을 설정하지 않으셨어요.</p>
            )}
          </div>

          {selectedExercise && (
            <div>
              <label className="text-sm font-medium block mb-2">
                {selectedExercise.koreanName} ({currentUnit})
              </label>
              <div className="flex items-center justify-center space-x-4 bg-secondary/30 p-4 rounded-lg">
                <Button variant="ghost" size="icon" onClick={() => setLogValue(Math.max(0, logValue - (getStepValue(selectedExercise))))} aria-label="값 감소" disabled={isUploading}>
                  <MinusCircle className="h-8 w-8 text-primary" />
                </Button>
                <span className="text-4xl font-bold w-20 text-center">{logValue}</span>
                <Button variant="ghost" size="icon" onClick={() => setLogValue(logValue + (getStepValue(selectedExercise)))} aria-label="값 증가" disabled={isUploading}>
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

          {selectedExercise && canUseCameraForExercise && (
            <Button
              variant="secondary"
              className="w-full py-3 text-base rounded-lg mt-4"
              onClick={() => onSwitchToCameraMode!(selectedExercise.id)}
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
          <Button onClick={handleSave} className="py-3 text-base rounded-lg" disabled={isUploading || !selectedExercise || (logValue === 0 && !selectedFile)}>
            {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {isUploading ? '저장 중...' : '기록 저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseLogForm;
