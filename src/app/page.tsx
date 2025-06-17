'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import ClassSelector from '@/components/ClassSelector';
import StudentCard from '@/components/StudentCard';
import ExerciseLogForm from '@/components/ExerciseLogForm';
import ExerciseSummaryChart from '@/components/ExerciseSummaryChart';
import AiSuggestionBox from '@/components/AiSuggestionBox';
import type { Student, ClassName, RecordedExercise } from '@/lib/types';
import { STUDENTS_DATA, CLASSES } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart2, Lightbulb, ListChecks } from 'lucide-react';

export default function Home() {
  const [selectedClass, setSelectedClass] = useState<ClassName | undefined>(CLASSES[0]);
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [selectedStudentForLog, setSelectedStudentForLog] = useState<Student | null>(null);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [recordedExercises, setRecordedExercises] = useState<RecordedExercise[]>(() => {
    if (typeof window !== 'undefined') {
      const savedLogs = localStorage.getItem('physEdPalLogs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    }
    return [];
  });
  const [activeTab, setActiveTab] = useState<string>("students");


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('physEdPalLogs', JSON.stringify(recordedExercises));
    }
  }, [recordedExercises]);

  useEffect(() => {
    if (selectedClass) {
      setStudentsInClass(STUDENTS_DATA.filter(student => student.class === selectedClass));
    } else {
      setStudentsInClass([]);
    }
  }, [selectedClass]);

  const handleClassChange = (className: ClassName) => {
    setSelectedClass(className);
  };

  const handleOpenLogForm = (student: Student) => {
    setSelectedStudentForLog(student);
    setIsLogFormOpen(true);
  };

  const handleCloseLogForm = () => {
    setIsLogFormOpen(false);
    setSelectedStudentForLog(null);
  };

  const handleSaveExerciseLog = (log: Omit<RecordedExercise, 'id'>) => {
    setRecordedExercises(prev => [...prev, { ...log, id: `log-${Date.now()}-${Math.random()}` }]);
  };
  
  const memoizedExerciseSummaryChart = useMemo(() => (
    <ExerciseSummaryChart recordedExercises={recordedExercises} students={STUDENTS_DATA} />
  ), [recordedExercises]);

  const memoizedAiSuggestionBox = useMemo(() => <AiSuggestionBox />, []);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <section aria-labelledby="class-selection-heading" className="bg-card p-6 rounded-xl shadow-md">
          <h2 id="class-selection-heading" className="text-xl font-semibold mb-4 font-headline">
            Select Class
          </h2>
          <ClassSelector selectedClass={selectedClass} onClassChange={handleClassChange} />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto rounded-lg p-1.5">
            <TabsTrigger value="students" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Users className="mr-2 h-5 w-5" /> Students
            </TabsTrigger>
            <TabsTrigger value="log" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <ListChecks className="mr-2 h-5 w-5" /> Activity Log
            </TabsTrigger>
            <TabsTrigger value="summary" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <BarChart2 className="mr-2 h-5 w-5" /> Summary
            </TabsTrigger>
            <TabsTrigger value="ai" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
              <Lightbulb className="mr-2 h-5 w-5" /> AI Coach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <section aria-labelledby="student-list-heading">
              <h2 id="student-list-heading" className="text-xl font-semibold mb-4 font-headline">
                {selectedClass ? `Students in ${selectedClass}` : 'Select a class to see students'}
              </h2>
              {selectedClass && studentsInClass.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {studentsInClass.map(student => (
                    <StudentCard 
                      key={student.id} 
                      student={student} 
                      onLogExercise={handleOpenLogForm}
                      recordedExercises={recordedExercises}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {selectedClass ? 'No students in this class.' : 'Please select a class.'}
                </p>
              )}
            </section>
          </TabsContent>
          
          <TabsContent value="log" className="mt-6">
             <section aria-labelledby="activity-log-heading">
                <h2 id="activity-log-heading" className="text-xl font-semibold mb-4 font-headline">Recent Activity</h2>
                {recordedExercises.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto bg-card p-4 rounded-xl shadow-md">
                    {recordedExercises
                      .filter(log => !selectedClass || log.className === selectedClass)
                      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id) ) // sort by date desc, then by id for stable sort
                      .slice(0, 20) // Show recent 20 logs for the selected class
                      .map(log => {
                        const student = STUDENTS_DATA.find(s => s.id === log.studentId);
                        const exercise = STUDENTS_DATA.find(e => e.id === log.exerciseId); // This seems to be a typo, should be EXERCISES.find
                        const exerciseInfo = EXERCISES.find(ex => ex.id === log.exerciseId);
                        return (
                          <div key={log.id} className="p-3 bg-secondary/30 rounded-lg shadow-sm text-sm">
                            <p><strong>{student?.name || 'Unknown Student'}</strong> ({log.className})</p>
                            <p>Logged {log.value} {exerciseInfo?.unit} of {exerciseInfo?.name || 'Unknown Exercise'}</p>
                            <p className="text-xs text-muted-foreground">Date: {new Date(log.date).toLocaleDateString()}</p>
                          </div>
                        );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No activities logged yet.</p>
                )}
             </section>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <section aria-labelledby="visualization-heading">
              <h2 id="visualization-heading" className="sr-only">Exercise Visualization</h2>
              {memoizedExerciseSummaryChart}
            </section>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
             <section aria-labelledby="ai-suggestion-heading">
                <h2 id="ai-suggestion-heading" className="sr-only">AI Exercise Suggestion</h2>
                {memoizedAiSuggestionBox}
              </section>
          </TabsContent>
        </Tabs>

        {selectedStudentForLog && (
          <ExerciseLogForm
            student={selectedStudentForLog}
            isOpen={isLogFormOpen}
            onClose={handleCloseLogForm}
            onSave={handleSaveExerciseLog}
            recordedExercises={recordedExercises}
          />
        )}
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} PhysEd Pal. Keeping students active!
      </footer>
    </div>
  );
}
