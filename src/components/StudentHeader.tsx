
'use client';

import React from 'react';
import { Target, UserCircle2 } from 'lucide-react';
import type { Gender } from '@/lib/types';
import { AVATAR_OPTIONS } from '@/data/avatarOptions';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudentHeaderProps {
  studentName: string;
  gender: Gender;
  avatarId?: string | null; // Can be null or undefined if not set
  onChangeAvatar: () => void;
  dailyCompliment?: string;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const StudentHeader: React.FC<StudentHeaderProps> = ({ studentName, gender, avatarId, onChangeAvatar, dailyCompliment }) => {
  const titleText = `${studentName}의 운동기록장`;

  const headerBgClass = gender === 'male' 
    ? 'bg-primary text-primary-foreground' 
    : 'bg-[#E6E6FA] text-slate-700'; 

  const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === avatarId)?.icon;

  return (
    <header className={cn('p-4 shadow-md sticky top-0 z-50', headerBgClass)}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {SelectedAvatarIcon ? (
            <Avatar className="h-10 w-10 border-2 border-background/50">
              <SelectedAvatarIcon className="h-full w-full p-1.5" />
            </Avatar>
          ) : (
            <Avatar className="h-10 w-10 border-2 border-background/50 bg-background/20">
              <AvatarFallback className={cn("text-lg", gender === 'male' ? 'text-primary-foreground' : 'text-slate-600', 'bg-transparent')}>
                {getInitials(studentName)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col">
            {dailyCompliment && <p className={cn("text-xs hidden sm:block", gender === 'male' ? 'text-primary-foreground/80' : 'text-slate-600/80')}>{dailyCompliment}</p>}
            <h1 className="text-xl sm:text-2xl font-bold font-headline truncate" title={titleText}>
              {titleText}
            </h1>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onChangeAvatar} 
          className={cn("rounded-full hover:bg-background/20", gender === 'male' ? 'text-primary-foreground hover:text-primary-foreground' : 'text-slate-700 hover:text-slate-700')}
          aria-label="아바타 변경"
        >
          <UserCircle2 className="h-7 w-7" />
        </Button>
      </div>
    </header>
  );
};

export default StudentHeader;
    
