
import type React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassName } from "@/lib/types";
import { UserPlus, Save } from 'lucide-react';

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newStudentData: { name: string; class: ClassName }) => void;
  allClasses: ClassName[];
}

const AddStudentDialog: React.FC<AddStudentDialogProps> = ({ isOpen, onClose, onSave, allClasses }) => {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassName | undefined>(allClasses[0]);

  const handleSave = () => {
    if (name.trim() && selectedClass) {
      onSave({ name: name.trim(), class: selectedClass });
      setName(''); // Reset name
      // setSelectedClass(allClasses[0]); // Optionally reset class
      onClose();
    } else {
      // Basic validation feedback (could be improved with toasts or error messages)
      alert("학생 이름과 학급을 모두 선택해주세요.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <UserPlus className="mr-2 h-6 w-6 text-primary" />
            새 학생 추가
          </DialogTitle>
          <DialogDescription>
            새로운 학생의 이름과 학급을 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName" className="text-base">학생 이름</Label>
            <Input
              id="studentName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              className="text-base py-3 rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentClass" className="text-base">학급</Label>
            <Select
              value={selectedClass}
              onValueChange={(value: ClassName) => setSelectedClass(value)}
            >
              <SelectTrigger id="studentClass" className="w-full text-base py-6 rounded-lg">
                <SelectValue placeholder="학급 선택" />
              </SelectTrigger>
              <SelectContent>
                {allClasses.map((className) => (
                  <SelectItem key={className} value={className} className="text-base py-2">
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg">취소</Button>
          </DialogClose>
          <Button onClick={handleSave} className="py-3 text-base rounded-lg">
            <Save className="mr-2 h-5 w-5" /> 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
