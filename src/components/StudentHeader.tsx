
'use client';

import React from 'react';
import { Target, UserCircle2, Mail } from 'lucide-react';
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
  onOpenMailbox: () => void;
  unreadMailCount: number;
}

const getInitials = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const StudentHeader: React.FC<StudentHeaderProps> = ({ studentName, gender, avatarId, onChangeAvatar, dailyCompliment, onOpenMailbox, unreadMailCount }) => {
  const titleText = `${studentName}의 운동기록장`;

  const headerStyles = {
    male: {
      bg: 'bg-primary',
      text: 'text-primary-foreground',
      complimentText: 'text-yellow-400 dark:text-yellow-300', // Brighter yellow
      avatarFallback: 'text-primary-foreground',
      buttonText: 'text-primary-foreground hover:text-primary-foreground',
    },
    female: {
      bg: 'bg-lime-100 dark:bg-lime-900', 
      text: 'text-green-700 dark:text-green-300', 
      complimentText: 'text-yellow-400 dark:text-yellow-300', // Brighter yellow
      avatarFallback: 'text-green-600 dark:text-green-400',
      buttonText: 'text-green-700 dark:text-green-300 hover:text-green-700 dark:hover:text-green-300',
    }
  };

  const currentStyle = gender === 'male' ? headerStyles.male : headerStyles.female;

  const SelectedAvatarIcon = AVATAR_OPTIONS.find(opt => opt.id === avatarId)?.icon;

  return (
    <header className={cn('p-4 shadow-md sticky top-0 z-50', currentStyle.bg, currentStyle.text)}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {SelectedAvatarIcon ? (
            <Avatar className="h-10 w-10 border-2 border-background/50">
              <SelectedAvatarIcon className="h-full w-full p-1.5" />
            </Avatar>
          ) : (
            <Avatar className={cn("h-10 w-10 border-2 border-background/50", gender === 'male' ? 'bg-background/20' : 'bg-green-200/50 dark:bg-green-800/50')}>
              <AvatarFallback className={cn("text-lg bg-transparent", currentStyle.avatarFallback)}>
                {getInitials(studentName)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col">
            {dailyCompliment && (
              <p className={cn("text-xs", currentStyle.complimentText, "block")}> 
                {dailyCompliment}
              </p>
            )}
            <h1 className="text-xl sm:text-2xl font-bold font-headline truncate" title={titleText}>
              {titleText}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onOpenMailbox} 
                    className={cn("rounded-full hover:bg-background/20", currentStyle.buttonText)}
                    aria-label="편지함"
                >
                    <Mail className="h-7 w-7" />
                </Button>
                {unreadMailCount > 0 && (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadMailCount}
                    </div>
                )}
            </div>
            <Button 
            variant="ghost" 
            size="icon" 
            onClick={onChangeAvatar} 
            className={cn("rounded-full hover:bg-background/20", currentStyle.buttonText)}
            aria-label="아바타 변경"
            >
            <UserCircle2 className="h-7 w-7" />
            </Button>
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;
