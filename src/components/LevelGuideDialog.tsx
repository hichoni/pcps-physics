
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LevelInfo } from '@/lib/types';
import { Award, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  levelTiers: LevelInfo[];
}

const LevelGuideDialog: React.FC<LevelGuideDialogProps> = ({ isOpen, onClose, levelTiers }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Award className="mr-2 h-6 w-6 text-primary" />
            풍풍이 체력탐험대 등급 안내
          </DialogTitle>
          <DialogDescription>
            운동 목표를 달성하고 XP를 모아 등급을 올려보세요!
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-6 border-t border-b">
          <div className="space-y-4">
            {levelTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div key={tier.level} className={cn("flex items-center p-3 rounded-lg border", tier.level === 10 ? "bg-fuchsia-500/10 border-fuchsia-500/30" : "bg-secondary/30")}>
                  <Icon className={cn("h-8 w-8 mr-4", tier.colorClass)} />
                  <div className="flex-grow">
                    <p className={cn("font-semibold", tier.colorClass)}>{tier.level}단계: {tier.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.minXp} XP ~ {tier.maxXp === Infinity ? '그 이상' : `${tier.maxXp -1} XP`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center mb-2">
                <Info className="h-5 w-5 mr-2 text-primary" />
                <h4 className="font-semibold text-primary">XP 획득 규칙</h4>
            </div>
            <p className="text-sm text-foreground/80">
              오늘의 운동 목표를 1개 달성할 때마다 <strong className="text-amber-600 dark:text-amber-400">10 XP</strong>를 얻을 수 있습니다!
              꾸준히 운동하고 더 높은 등급에 도전해보세요!
            </p>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline" className="py-3 text-base rounded-lg" onClick={onClose}>
              <X className="mr-2 h-5 w-5" /> 닫기
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelGuideDialog;

    