
'use client';

import React from 'react';
import { PATCH_NOTES } from '@/data/patchNotes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Rocket, Wrench, Zap } from 'lucide-react';

const PatchNotes: React.FC = () => {
  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-xl">
          <History className="h-6 w-6 text-primary" />
          업데이트 기록 (패치노트)
        </CardTitle>
        <CardDescription>
          풍풍이 체력탐험대가 어떻게 발전해왔는지 확인해보세요!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-8">
            {PATCH_NOTES.map((note) => (
              <div key={note.version} className="relative pl-6">
                <div className="absolute left-0 top-1 h-full w-px bg-border"></div>
                <div className="absolute left-[-5px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background"></div>
                <div className="space-y-1">
                  <p className="font-semibold text-primary">{note.version}</p>
                  <p className="text-xs text-muted-foreground">{note.date}</p>
                </div>
                <div className="mt-4 space-y-4">
                  {note.features && note.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-green-500" />
                        새로운 기능
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
                        {note.features.map((item, index) => (
                          <li key={`feat-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                   {note.improvements && note.improvements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        개선 사항
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
                        {note.improvements.map((item, index) => (
                          <li key={`imp-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {note.fixes && note.fixes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-orange-500" />
                        버그 수정
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
                        {note.fixes.map((item, index) => (
                          <li key={`fix-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PatchNotes;
