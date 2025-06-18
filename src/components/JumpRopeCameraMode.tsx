
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, XCircle, Save, RotateCcw, PlusSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface JumpRopeCameraModeProps {
  onClose: () => void;
  onSave: (count: number) => void;
  exerciseIdForCamera?: string | null; // 부모로부터 운동 ID를 받을 수 있도록
}

const JumpRopeCameraMode: React.FC<JumpRopeCameraModeProps> = ({ onClose, onSave, exerciseIdForCamera }) => {
  const [jumpCount, setJumpCount] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: '카메라 접근 불가',
          description: '이 브라우저에서는 카메라 기능을 사용할 수 없습니다.',
        });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: '카메라 접근 거부됨',
          description: '줄넘기 자동 기록을 사용하려면 브라우저 설정에서 카메라 접근을 허용해주세요.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const handleIncrementJump = () => {
    setJumpCount(prevCount => prevCount + 1);
  };

  const handleSaveAndClose = () => {
    if (!exerciseIdForCamera) {
        toast({title: "오류", description: "카메라 기록을 위한 운동 ID가 지정되지 않았습니다.", variant: "destructive"});
        onClose(); // 운동 ID 없으면 그냥 닫기
        return;
    }
    onSave(jumpCount);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <Camera className="mr-3 h-7 w-7 text-primary" />
            AI 줄넘기 기록 (시뮬레이션)
          </CardTitle>
          <CardDescription>
            카메라를 보고 줄넘기를 시작하세요! 현재는 시뮬레이션 모드입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-destructive-foreground text-center p-4">카메라 접근 권한이 필요합니다.</p>
              </div>
            )}
          </div>

          {hasCameraPermission === null && (
            <Alert>
              <AlertTitle>카메라 권한 확인 중...</AlertTitle>
              <AlertDescription>
                카메라 사용 권한을 확인하고 있습니다. 잠시만 기다려주세요.
              </AlertDescription>
            </Alert>
          )}

          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTitle>카메라 접근 불가</AlertTitle>
              <AlertDescription>
                카메라를 사용할 수 없습니다. 브라우저 설정을 확인하고 카메라 접근을 허용해주세요.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center">
            <p className="text-lg text-muted-foreground">줄넘기 횟수</p>
            <p className="text-6xl font-bold text-primary">{jumpCount}</p>
          </div>

          <Button onClick={handleIncrementJump} variant="outline" className="w-full py-3 text-base rounded-lg">
            <PlusSquare className="mr-2 h-5 w-5" /> 점프 추가 (시뮬레이션)
          </Button>
          
          <div className="text-xs text-muted-foreground text-center p-2 bg-amber-50 border border-amber-200 rounded-md">
            <strong>안내:</strong> 현재 이 기능은 실제 AI 점프 감지를 하지 않으며, 시뮬레이션으로 동작합니다. 
            "점프 추가" 버튼으로 횟수를 수동으로 늘릴 수 있습니다.
          </div>

        </CardContent>
        <div className="flex gap-2 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-b-xl">
          <Button onClick={onClose} variant="outline" className="flex-1 py-3 text-base rounded-lg">
            <XCircle className="mr-2 h-5 w-5" /> 닫기
          </Button>
          <Button onClick={handleSaveAndClose} className="flex-1 py-3 text-base rounded-lg" disabled={!exerciseIdForCamera}>
            <Save className="mr-2 h-5 w-5" /> 운동 종료 및 저장
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default JumpRopeCameraMode;
