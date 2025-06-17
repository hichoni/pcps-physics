
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Save, ShieldAlert } from 'lucide-react';

interface ChangeOwnPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPin: string) => void;
}

const ChangeOwnPinDialog: React.FC<ChangeOwnPinDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setNewPin('');
      setConfirmPin('');
      setPinError(null);
    }
  }, [isOpen]);

  const handleNewPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setNewPin(value);
      if (pinError) setPinError(null);
    }
  };

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setConfirmPin(value);
      if (pinError) setPinError(null);
    }
  };

  const handleSavePin = () => {
    if (!/^\d{4}$/.test(newPin)) {
      setPinError("새 PIN은 4자리 숫자여야 합니다.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("새 PIN과 확인 PIN이 일치하지 않습니다.");
      return;
    }
    setPinError(null);
    onSave(newPin);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <ShieldAlert className="mr-2 h-6 w-6 text-primary" />
            나의 PIN 변경
          </DialogTitle>
          <DialogDescription>
            새로운 4자리 숫자 PIN을 입력하고 확인해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newOwnPin" className="text-base">새 PIN</Label>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <Input
                id="newOwnPin"
                type="password"
                value={newPin}
                onChange={handleNewPinChange}
                placeholder="새 PIN 4자리"
                maxLength={4}
                className="text-base py-3 rounded-lg tracking-widest"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmOwnPin" className="text-base">새 PIN 확인</Label>
             <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmOwnPin"
                type="password"
                value={confirmPin}
                onChange={handleConfirmPinChange}
                placeholder="새 PIN 다시 입력"
                maxLength={4}
                className="text-base py-3 rounded-lg tracking-widest"
              />
            </div>
          </div>
          {pinError && <p className="text-sm text-destructive mt-1">{pinError}</p>}
        </div>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg">취소</Button>
          </DialogClose>
          <Button onClick={handleSavePin} className="py-3 text-base rounded-lg">
            <Save className="mr-2 h-5 w-5" /> PIN 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeOwnPinDialog;
