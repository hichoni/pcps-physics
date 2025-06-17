
import type React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassName } from "@/lib/types"; // ClassName is now string

interface ClassSelectorProps {
  selectedClass: ClassName | undefined; // ClassName is string
  onClassChange: (className: ClassName | 'all') => void; // Allow 'all' (string or 'all')
  allClasses: ClassName[]; // Use prop for class list (string[])
}

const ClassSelector: React.FC<ClassSelectorProps> = ({ selectedClass, onClassChange, allClasses }) => {
  return (
    <Select 
        onValueChange={(value: ClassName | 'all') => onClassChange(value)} 
        value={selectedClass || 'all'}
        disabled={allClasses.length === 0 && !selectedClass} // Disable if no classes and "all" isn't selected
    >
      <SelectTrigger className="w-full md:w-[280px] text-base py-6 rounded-lg shadow-sm">
        <SelectValue placeholder={allClasses.length === 0 ? "등록된 학급 없음" : "전체 보기"} />
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
