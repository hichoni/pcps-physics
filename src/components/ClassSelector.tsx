
import type React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassName } from "@/lib/types";
// ALL_CLASSES is not used if allClasses prop is provided from page.tsx
// import { ALL_CLASSES } from "@/lib/types"; 

interface ClassSelectorProps {
  selectedClass: ClassName | undefined;
  onClassChange: (className: ClassName | 'all') => void; // Allow 'all'
  allClasses: ClassName[]; // Use prop for class list
}

const ClassSelector: React.FC<ClassSelectorProps> = ({ selectedClass, onClassChange, allClasses }) => {
  return (
    <Select onValueChange={(value: ClassName | 'all') => onClassChange(value)} value={selectedClass || 'all'}>
      <SelectTrigger className="w-full md:w-[280px] text-base py-6 rounded-lg shadow-sm">
        <SelectValue placeholder="전체 보기" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-base py-2">전체 보기</SelectItem>
        {allClasses.map((className) => (
          <SelectItem key={className} value={className} className="text-base py-2">
            {className}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ClassSelector;
