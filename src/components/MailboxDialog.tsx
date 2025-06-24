'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle, Gift, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import type { MailboxMessage, StudentGoal, Exercise as ExerciseType } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getIconByName } from '@/lib/iconMap';

interface MailboxDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messages: MailboxMessage[];
  mySecretFriendName: string;
  currentStudentName: string;
  onSendMessage: (type: 'cheer' | 'mission', content: string) => Promise<void>;
  onCompleteMission: (messageId: string) => Promise<void>;
  secretFriendTodaysGoals?: StudentGoal;
  availableExercises?: ExerciseType[];
}

const MailboxDialog: React.FC<MailboxDialogProps> = ({
  isOpen,
  onClose,
  messages,
  mySecretFriendName,
  currentStudentName,
  onSendMessage,
  onCompleteMission,
  secretFriendTodaysGoals = {},
  availableExercises = [],
}) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'cheer' | 'mission'>('cheer');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    await onSendMessage(messageType, newMessage.trim());
    setNewMessage('');
    setIsSending(false);
    setActiveTab('inbox'); // Switch back to inbox after sending
  };
  
  const hasGoals = secretFriendTodaysGoals && Object.keys(secretFriendTodaysGoals).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 rounded-xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Mail className="mr-2 h-6 w-6 text-primary" />
            {currentStudentName}의 편지함
          </DialogTitle>
          <DialogDescription>
            비밀친구와 메시지를 주고받고 미션을 확인하세요.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox">받은 편지</TabsTrigger>
            <TabsTrigger value="send">편지 쓰기</TabsTrigger>
          </TabsList>
          <TabsContent value="inbox" className="p-0">
            <ScrollArea className="h-96 p-6">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("p-4 rounded-lg border", msg.isRead ? "bg-secondary/30" : "bg-primary/10 border-primary/50")}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 font-semibold">
                          {msg.type === 'mission' ? <Gift className="h-4 w-4 text-red-500" /> : <MessageSquare className="h-4 w-4 text-blue-500" />}
                          <span>{msg.type === 'mission' ? '비밀 미션!' : '응원 메시지'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true, locale: ko })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 mb-3">{msg.content}</p>
                      {msg.type === 'mission' && (
                        msg.missionStatus === 'completed' ? (
                          <div className="text-sm font-semibold text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            미션 완료 (+10 XP)
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => onCompleteMission(msg.id)}>
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            미션 완료!
                          </Button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <p>아직 받은 편지가 없어요.</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="send" className="p-6 space-y-4">
            <p className="text-sm">
              나의 비밀친구, <strong className="text-primary">{mySecretFriendName}</strong>에게 보낼 편지를 작성해주세요.
            </p>
            <RadioGroup value={messageType} onValueChange={(v: any) => setMessageType(v)} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cheer" id="cheer" />
                <Label htmlFor="cheer">응원하기</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mission" id="mission" />
                <Label htmlFor="mission">미션주기</Label>
              </div>
            </RadioGroup>

            {messageType === 'mission' && (
                <div className="space-y-2">
                    <Label>미션 제안하기</Label>
                    <div className="p-3 border rounded-lg bg-secondary/30 space-y-2 max-h-32 overflow-y-auto">
                        {hasGoals ? (
                            Object.entries(secretFriendTodaysGoals).map(([exerciseId, goal]) => {
                                const exercise = availableExercises.find(ex => ex.id === exerciseId);
                                if (!exercise) return null;
                                const Icon = getIconByName(exercise.iconName);

                                const renderGoal = (field: 'count' | 'time' | 'steps', unit: string | undefined) => {
                                    const goalValue = goal[field];
                                    if (!unit || !goalValue) return null;
                                    
                                    const suggestionAmount = field === 'time' ? 10 : (field === 'steps' ? 50 : 5);
                                    const suggestionMessage = `비밀친구야! 오늘 ${exercise.koreanName} 목표에 ${suggestionAmount}${unit}만 더 추가해서 도전해보는 건 어때? 너라면 할 수 있어! 화이팅! 🎉`;

                                    return (
                                        <div key={`${exercise.id}-${field}`} className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-1.5">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                {exercise.koreanName}: {goalValue}{unit}
                                            </span>
                                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setNewMessage(suggestionMessage)}>
                                                미션 제안
                                            </Button>
                                        </div>
                                    )
                                }

                                return (
                                    <React.Fragment key={exerciseId}>
                                        {renderGoal('count', exercise.countUnit)}
                                        {renderGoal('time', exercise.timeUnit)}
                                        {renderGoal('steps', exercise.stepsUnit)}
                                    </React.Fragment>
                                )
                            })
                        ) : (
                            <p className="text-sm text-center text-muted-foreground py-2">
                                비밀친구가 아직 오늘의 운동 목표를 설정하지 않았어요.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={messageType === 'cheer' ? '따뜻한 응원의 메시지를 보내보세요!' : '친구의 목표를 기반으로 미션을 제안하거나, 자유롭게 미션을 만들어주세요!'}
              rows={5}
            />
            <Alert variant="default" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                보낸 편지는 수정하거나 삭제할 수 없으니 신중하게 작성해주세요.
              </AlertDescription>
            </Alert>
            <Button onClick={handleSend} disabled={isSending || !newMessage.trim()} className="w-full">
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSending ? '보내는 중...' : '보내기'}
            </Button>
          </TabsContent>
        </Tabs>
        <DialogFooter className="p-6 pt-4 bg-slate-50 dark:bg-slate-800/30">
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MailboxDialog;
