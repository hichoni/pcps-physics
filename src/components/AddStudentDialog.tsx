
import type React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ClassName, Gender } from "@/lib/types";
import { UserPlus, Save } from 'lucide-react';

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newStudentData: { name: string; class: ClassName; studentNumber: number; gender: Gender }) => void;
  allClasses: ClassName[];
}

const AddStudentDialog: React.FC<AddStudentDialogProps> = ({ isOpen, onClose, onSave, allClasses }) => {
  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState<string>('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [selectedClass, setSelectedClass] = useState<ClassName | undefined>(allClasses[0]);

  const handleSave = () => {
    const num = parseInt(studentNumber, 10);
    if (name.trim() && selectedClass && !isNaN(num) && num > 0 && gender) {
      onSave({ name: name.trim(), class: selectedClass, studentNumber: num, gender });
      setName('');
      setStudentNumber('');
      setGender(undefined);
      // setSelectedClass(allClasses[0]); // Optionally reset class
      onClose();
    } else {
      alert("모든 필드를 올바르게 입력해주세요 (학생 이름, 학급, 학번, 성별). 학번은 숫자여야 합니다.");
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
            새로운 학생의 이름, 학급, 학번, 성별을 입력해주세요.
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
            <Label htmlFor="studentNumber" className="text-base">학번</Label>
            <Input
              id="studentNumber"
              type="number"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="예: 1"
              className="text-base py-3 rounded-lg"
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base">성별</Label>
            <RadioGroup value={gender} onValueChange={(value: Gender) => setGender(value)} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="text-base font-normal">남자</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="text-base font-normal">여자</Label>
              </div>
            </RadioGroup>
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
