
'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import type { Student, RecordedExercise, Exercise as ExerciseType } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Loader2, Save, X, Camera } from 'lucide-react';
import { storage, db } from '@/lib/firebase'; // Import db for potential use if needed, storage is key
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UploadProofShotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  logsWithoutImageToday: RecordedExercise[];
  availableExercises: ExerciseType[];
  onUploadComplete: (logId: string, imageUrl: string) => void; // Callback to update parent state
}

const UploadProofShotDialog: React.FC<UploadProofShotDialogProps> = ({
  isOpen,
  onClose,
  student,
  logsWithoutImageToday,
  availableExercises,
  onUploadComplete,
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (logsWithoutImageToday.length > 0) {
        // Default to the most recent log without an image
        const sortedLogs = [...logsWithoutImageToday].sort((a, b) => 
          parseISO(b.date).getTime() - parseISO(a.date).getTime() || (b.id && a.id ? b.id.localeCompare(a.id) : 0)
        );
        setSelectedLogId(sortedLogs[0].id);
      } else {
        setSelectedLogId('');
      }
      setSelectedFile(null);
      setFilePreview(null);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [isOpen, logsWithoutImageToday]);

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

  const handleSaveImage = async () => {
    if (!student || !selectedLogId || !selectedFile) {
      toast({ title: "정보 부족", description: "학생, 대상 기록 또는 파일이 선택되지 않았습니다.", variant: "destructive" });
      return;
    }

    const targetLog = logsWithoutImageToday.find(log => log.id === selectedLogId);
    if (!targetLog) {
      toast({ title: "오류", description: "선택된 기록을 찾을 수 없습니다.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = new Date().getTime();
      const uniqueFileName = `${timestamp}_${selectedFile.name}`;
      const filePath = `proofShots/${student.id}/${format(parseISO(targetLog.date), "yyyy-MM-dd")}/${targetLog.exerciseId}/${uniqueFileName}`;
      const fileRef = storageRef(storage, filePath);
      const uploadTask = uploadBytesResumable(fileRef, selectedFile);

      let imageUrl: string | undefined = undefined;

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

      if (imageUrl) {
        const logDocRef = doc(db, "exerciseLogs", selectedLogId);
        await updateDoc(logDocRef, { imageUrl: imageUrl });
        onUploadComplete(selectedLogId, imageUrl); // Notify parent to update state
        toast({ title: "성공!", description: "인증샷이 성공적으로 업로드 및 연결되었습니다." });
        onClose();
      } else {
        throw new Error("Image URL was not obtained after upload.");
      }
    } catch (error) {
      console.error("Error saving proof shot:", error);
      toast({ title: "저장 실패", description: "인증샷 저장 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const getExerciseName = (exerciseId: string) => {
    return availableExercises.find(ex => ex.id === exerciseId)?.koreanName || '알 수 없는 운동';
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Camera className="mr-2 h-6 w-6 text-primary" />
            오.운.완 인증샷 업로드
          </DialogTitle>
          <DialogDescription>
            오늘의 운동 기록에 멋진 인증샷을 추가해주세요!
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {logsWithoutImageToday.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              인증샷을 추가할 수 있는 오늘의 운동 기록이 없습니다.
            </p>
          ) : (
            <>
              <div>
                <Label htmlFor="logSelect" className="text-sm font-medium">인증샷 추가할 운동</Label>
                <Select value={selectedLogId} onValueChange={setSelectedLogId} disabled={isUploading}>
                  <SelectTrigger id="logSelect" className="w-full mt-1 text-base py-3 rounded-lg">
                    <SelectValue placeholder="운동 기록을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {logsWithoutImageToday.map(log => {
                        let valueDisplay = "";
                        const exerciseInfo = availableExercises.find(ex => ex.id === log.exerciseId);
                        if (exerciseInfo) {
                            if (exerciseInfo.category === 'count_time') {
                                if (exerciseInfo.countUnit) {
                                    valueDisplay = `${log.countValue || 0}${exerciseInfo.countUnit}`;
                                } else if (exerciseInfo.timeUnit) {
                                    valueDisplay = `${log.timeValue || 0}${exerciseInfo.timeUnit}`;
                                }
                            } else if (exerciseInfo.category === 'steps_distance') {
                                valueDisplay = `${log.stepsValue || 0}${exerciseInfo.stepsUnit || ''}`;
                            }
                        }
                        
                        valueDisplay = valueDisplay.trim();
                        if (!valueDisplay || /^[0-9]*0[a-zA-Z가-힣]*/.test(valueDisplay)) valueDisplay = "기록됨";


                        return (
                            <SelectItem key={log.id} value={log.id} className="text-base py-2">
                                {getExerciseName(log.exerciseId)} ({valueDisplay}) - {format(parseISO(log.date), "HH:mm", { locale: ko })}
                            </SelectItem>
                        );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="proofShotUpload" className="text-sm font-medium">사진 선택 (5MB 이하)</Label>
                <Input
                  id="proofShotUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 rounded-lg mt-1"
                  disabled={isUploading || !selectedLogId}
                />
                {filePreview && (
                  <div className="mt-3 relative w-full aspect-video border rounded-md overflow-hidden shadow-sm">
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
            </>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg" disabled={isUploading}><X className="mr-2 h-5 w-5" /> 취소</Button>
          </DialogClose>
          <Button 
            onClick={handleSaveImage} 
            className="py-3 text-base rounded-lg"
            disabled={isUploading || !selectedLogId || !selectedFile || logsWithoutImageToday.length === 0}
          >
            {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {isUploading ? '저장 중...' : '업로드 및 저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProofShotDialog;
