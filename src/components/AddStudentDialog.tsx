
import type React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Gender } from "@/lib/types"; 
import { UserPlus, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newStudentData: { name: string; grade: string; classNum: string; studentNumber: number; gender: Gender; pin: string; totalXp: number }) => void;
}

const GRADES = ["1", "2", "3", "4", "5", "6"];

const AddStudentDialog: React.FC<AddStudentDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState<string>('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [grade, setGrade] = useState<string>('');
  const [classNum, setClassNum] = useState<string>('');

  const handleSave = () => {
    const num = parseInt(studentNumber, 10);
    const classNumInt = parseInt(classNum, 10);

    if (name.trim() && grade && !isNaN(classNumInt) && classNumInt > 0 && !isNaN(num) && num > 0 && gender) {
      onSave({ 
        name: name.trim(), 
        grade,
        classNum: classNum,
        studentNumber: num, 
        gender, 
        pin: "0000", // 기본 PIN "0000"
        totalXp: 0 // XP 초기화
      }); 
      setName('');
      setStudentNumber('');
      setGender(undefined);
      setGrade('');
      setClassNum('');
      onClose();
    } else {
      alert("모든 필드를 올바르게 입력해주세요 (학생 이름, 학년, 반, 학번, 성별).");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setName('');
        setStudentNumber('');
        setGender(undefined);
        setGrade('');
        setClassNum('');
      }
    }}>
      <DialogContent className="sm:max-w-[425px] p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <UserPlus className="mr-2 h-6 w-6 text-primary" />
            새 학생 추가
          </DialogTitle>
          <DialogDescription>
            새로운 학생의 정보를 입력해주세요. 초기 PIN은 "0000"으로, XP는 0으로 자동 설정됩니다.
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
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="grade" className="text-base">학년</Label>
               <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="grade" className="text-base py-3 rounded-lg">
                  <SelectValue placeholder="학년 선택" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => <SelectItem key={g} value={g}>{g}학년</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classNum" className="text-base">반</Label>
              <Input
                id="classNum"
                type="number"
                value={classNum}
                onChange={(e) => setClassNum(e.target.value)}
                placeholder="예: 1"
                className="text-base py-3 rounded-lg"
                min="1"
              />
            </div>
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
