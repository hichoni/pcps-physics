import type React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassName } from "@/lib/types";
import { ALL_CLASSES } from "@/lib/types";

interface ClassSelectorProps {
  selectedClass: ClassName | undefined;
  onClassChange: (className: ClassName) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({ selectedClass, onClassChange }) => {
  return (
    <Select onValueChange={(value: ClassName) => onClassChange(value)} value={selectedClass}>
      <SelectTrigger className="w-full md:w-[280px] text-base py-6 rounded-lg shadow-sm">
        <SelectValue placeholder="Select a Class" />
      </SelectTrigger>
      <SelectContent>
        {ALL_CLASSES.map((className) => (
          <SelectItem key={className} value={className} className="text-base py-2">
            {className}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ClassSelector;
