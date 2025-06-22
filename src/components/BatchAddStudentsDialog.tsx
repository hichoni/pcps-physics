
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Student, Gender } from "@/lib/types";
import { FileUp, Loader2, Save, AlertCircle, Download, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Papa from 'papaparse';

type ParsedStudent = Omit<Student, 'id' | 'avatarSeed' | 'pin' | 'totalXp' | 'grade' | 'classNum'>;

interface BatchAddStudentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentsToAdd: Omit<Student, 'id' | 'avatarSeed'>[]) => Promise<void>;
}

const GRADES = ["1", "2", "3", "4", "5", "6"];
const CSV_TEMPLATE = "name,studentNumber,gender\n홍길동,1,male\n김영희,2,female";

const BatchAddStudentsDialog: React.FC<BatchAddStudentsDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [grade, setGrade] = useState('');
  const [classNum, setClassNum] = useState('');
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setGrade('');
    setClassNum('');
    setParsedData([]);
    setFileName('');
    setErrors([]);
    setIsParsing(false);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setParsedData([]);
    setErrors([]);
    setFileName('');
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setFileName(file.name);
      setIsParsing(true);
      Papa.parse<ParsedStudent>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validationErrors: string[] = [];
          const validStudents: ParsedStudent[] = [];

          results.data.forEach((row, index) => {
            const studentNumber = Number(row.studentNumber);
            if (!row.name || !row.studentNumber || !row.gender) {
              validationErrors.push(`[${index + 1}행] 필수 필드(name, studentNumber, gender)가 누락되었습니다.`);
            } else if (isNaN(studentNumber) || studentNumber <= 0) {
              validationErrors.push(`[${index + 1}행] 'studentNumber'는 양수여야 합니다.`);
            } else if (row.gender !== 'male' && row.gender !== 'female') {
              validationErrors.push(`[${index + 1}행] 'gender'는 'male' 또는 'female'이어야 합니다.`);
            } else {
              validStudents.push({
                name: row.name.trim(),
                studentNumber: studentNumber,
                gender: row.gender as Gender
              });
            }
          });

          if (validationErrors.length > 0) {
            setErrors(validationErrors);
          } else {
            setParsedData(validStudents);
          }
          setIsParsing(false);
        },
        error: (error) => {
          setErrors([`파일 파싱 오류: ${error.message}`]);
          setIsParsing(false);
        }
      });
    }
  };
  
  const downloadTemplate = () => {
    const blob = new Blob([`\uFEFF${CSV_TEMPLATE}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "학생_일괄추가_서식.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchSave = async () => {
    if (!grade || !classNum) {
        toast({ title: "오류", description: "학생들을 추가할 학년과 반을 먼저 선택해주세요.", variant: "destructive" });
        return;
    }
    if (parsedData.length === 0) {
        toast({ title: "오류", description: "추가할 학생 데이터가 없습니다. 파일을 업로드해주세요.", variant: "destructive" });
        return;
    }
    
    setIsSaving(true);
    const studentsToAdd = parsedData.map(student => ({
      ...student,
      grade,
      classNum,
      pin: '0000',
      totalXp: 0,
    }));
    
    try {
      await onSave(studentsToAdd);
      toast({ title: "성공", description: `${studentsToAdd.length}명의 학생이 성공적으로 추가되었습니다.` });
      handleClose();
    } catch (error) {
      console.error("Batch save failed:", error);
      toast({ title: "저장 실패", description: "학생 정보 저장 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <FileUp className="mr-2 h-6 w-6 text-primary" />
            학생 일괄 추가
          </DialogTitle>
          <DialogDescription>
            CSV 파일을 사용하여 여러 학생을 한 번에 추가합니다. 먼저 학생들을 추가할 학년과 반을 선택해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-y">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="batch-grade">학년</Label>
                        <Select value={grade} onValueChange={setGrade} disabled={isSaving}>
                            <SelectTrigger id="batch-grade"><SelectValue placeholder="학년 선택" /></SelectTrigger>
                            <SelectContent>
                                {GRADES.map(g => <SelectItem key={g} value={g}>{g}학년</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="batch-classNum">반</Label>
                        <Input id="batch-classNum" type="number" value={classNum} onChange={e => setClassNum(e.target.value)} placeholder="반 입력" disabled={isSaving} />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>CSV 파일 업로드</Label>
                    <div className="flex gap-2">
                         <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} disabled={!grade || !classNum || isSaving} className="flex-grow" />
                    </div>
                    <Button variant="link" onClick={downloadTemplate} className="p-0 h-auto text-sm">
                        <Download className="mr-1 h-4 w-4" /> CSV 서식 파일 다운로드
                    </Button>
                    <p className="text-xs text-muted-foreground">서식 파일은 `name`, `studentNumber`, `gender` 열을 포함해야 합니다. (gender는 `male` 또는 `female`)</p>
                </div>
                
                {isParsing && <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />파일을 읽는 중...</div>}

                {errors.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>파일 유효성 검사 오류</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc list-inside max-h-20 overflow-y-auto">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <div className="space-y-2">
                <Label>업로드 미리보기</Label>
                <ScrollArea className="h-64 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>이름</TableHead>
                                <TableHead>번호</TableHead>
                                <TableHead>성별</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.length > 0 ? (
                                parsedData.map((s, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{s.name}</TableCell>
                                        <TableCell>{s.studentNumber}</TableCell>
                                        <TableCell>{s.gender}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                        파일을 업로드하면 여기에 미리보기가 표시됩니다.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                {parsedData.length > 0 && 
                    <div className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />{parsedData.length}명의 학생 데이터가 유효합니다.</div>
                }
            </div>
        </div>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild><Button variant="outline" className="py-3 text-base rounded-lg" disabled={isSaving}>취소</Button></DialogClose>
          <Button onClick={handleBatchSave} disabled={isSaving || parsedData.length === 0 || errors.length > 0} className="py-3 text-base rounded-lg">
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            {isSaving ? '저장 중...' : `${parsedData.length}명 저장하기`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchAddStudentsDialog;
