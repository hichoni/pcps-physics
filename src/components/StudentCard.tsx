
import type React from 'react';
import { useState } from 'react';
import type { Student } from '@/lib/types';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, KeyRound, Eye, EyeOff, Gem, Award } from 'lucide-react';
import { AVATAR_OPTIONS } from '@/data/avatarOptions';
import { cn } from '@/lib/utils';
import { getIconByName } from '@/lib/iconMap';

interface StudentCardProps {
  student: Student;
  onDeleteStudent: (student: Student) => void;
  onManagePin: (student: Student) => void;
  onGiveXp: () => void;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const StudentCard: React.FC<StudentCardProps> = ({ student, onDeleteStudent, onManagePin, onGiveXp }) => {
  const [showPin, setShowPin] = useState(false);

  const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === student.avatarSeed)?.icon || getIconByName(null);

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center space-x-4 p-4 bg-secondary/30">
          <Avatar className={cn("h-12 w-12 border-2 border-primary p-0.5", SelectedAvatarIcon ? 'bg-background' : 'bg-primary text-primary-foreground')}>
            {student.avatarSeed && AVATAR_OPTIONS.find(opt => opt.id === student.avatarSeed) ? (
              <SelectedAvatarIcon className="h-full w-full text-primary" />
            ) : (
              <AvatarFallback className="text-lg bg-transparent">
                {getInitials(student.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle className="text-lg font-headline">{student.name}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {student.grade}학년 {student.classNum}반 {student.studentNumber}번 ({student.gender === 'male' ? '남' : '여'})
            </CardDescription>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center">
                  PIN: {showPin ? student.pin : '••••'}
                  <Button variant="ghost" size="icon" onClick={() => setShowPin(!showPin)} className="h-5 w-5 ml-1 p-0">
                      {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center font-semibold">
                  <Gem className="h-3 w-3 mr-1" />
                  XP: {(student.totalXp || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            상세 활동은 '활동 기록' 탭에서 확인하세요.
          </p>
        </CardContent>
      </div>
      <CardFooter className="p-3 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2">
        <Button onClick={onGiveXp} variant="outline" size="icon" className="rounded-lg py-2 h-auto px-2.5 border-amber-500 text-amber-500 hover:bg-amber-50" aria-label={`${student.name} 학생에게 XP 지급`}>
          <Award className="h-4 w-4" />
        </Button>
        <Button onClick={() => onManagePin(student)} variant="outline" size="icon" className="rounded-lg py-2 h-auto px-2.5" aria-label={`${student.name} 학생 PIN 관리`}>
          <KeyRound className="h-4 w-4" />
        </Button>
        <Button onClick={() => onDeleteStudent(student)} variant="destructive" size="icon" className="rounded-lg py-2 h-auto px-2.5" aria-label={`${student.name} 학생 삭제`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentCard;
