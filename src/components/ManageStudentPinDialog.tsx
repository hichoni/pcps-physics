
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Save } from 'lucide-react';

interface ManageStudentPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPin: string) => void;
  studentName: string | null;
}

const ManageStudentPinDialog: React.FC<ManageStudentPinDialogProps> = ({ isOpen, onClose, onSave, studentName }) => {
  const [newPin, setNewPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setNewPin('');
      setPinError(null);
    }
  }, [isOpen]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setNewPin(value);
      if (pinError) setPinError(null);
    }
  };

  const handleSavePin = () => {
    if (!/^\d{4}$/.test(newPin)) {
      setPinError("새 PIN은 4자리 숫자여야 합니다.");
      return;
    }
    setPinError(null);
    onSave(newPin);
  };

  if (!studentName) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <KeyRound className="mr-2 h-6 w-6 text-primary" />
            {studentName} 학생 PIN 변경
          </DialogTitle>
          <DialogDescription>
            학생의 새 PIN (4자리 숫자)을 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPin" className="text-base">새 PIN</Label>
            <Input
              id="newPin"
              type="password"
              value={newPin}
              onChange={handlePinChange}
              placeholder="예: 1234"
              maxLength={4}
              className="text-base py-3 rounded-lg tracking-widest"
            />
            {pinError && <p className="text-sm text-destructive mt-1">{pinError}</p>}
          </div>
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

export default ManageStudentPinDialog;
