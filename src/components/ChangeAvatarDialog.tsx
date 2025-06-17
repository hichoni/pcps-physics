
import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AVATAR_OPTIONS, type AvatarOption } from '@/data/avatarOptions';
import { CheckCircle, Palette, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChangeAvatarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatarId: string) => void;
  currentAvatarId?: string | null;
}

const ChangeAvatarDialog: React.FC<ChangeAvatarDialogProps> = ({ isOpen, onClose, onSave, currentAvatarId }) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatarId(currentAvatarId || null);
    }
  }, [isOpen, currentAvatarId]);

  const handleSaveAvatar = () => {
    if (selectedAvatarId) {
      onSave(selectedAvatarId);
    }
    onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Palette className="mr-2 h-6 w-6 text-primary" />
            아바타 선택
          </DialogTitle>
          <DialogDescription>
            마음에 드는 아바타를 선택해주세요!
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] sm:h-[400px] p-6 border-y">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {AVATAR_OPTIONS.map((avatar: AvatarOption) => (
              <Button
                key={avatar.id}
                variant="outline"
                className={cn(
                  "h-16 w-16 sm:h-20 sm:w-20 flex flex-col items-center justify-center p-2 rounded-lg relative transition-all duration-150",
                  selectedAvatarId === avatar.id ? "ring-2 ring-primary ring-offset-2 bg-primary/10" : "hover:bg-accent/50"
                )}
                onClick={() => setSelectedAvatarId(avatar.id)}
                title={avatar.name}
              >
                <avatar.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                {selectedAvatarId === avatar.id && (
                  <CheckCircle className="absolute top-1 right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg">취소</Button>
          </DialogClose>
          <Button onClick={handleSaveAvatar} disabled={!selectedAvatarId} className="py-3 text-base rounded-lg">
            <Save className="mr-2 h-5 w-5" /> 선택 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeAvatarDialog;
