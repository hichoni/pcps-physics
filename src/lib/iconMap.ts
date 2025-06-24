
import type { LucideIcon } from 'lucide-react';
import { 
  Footprints, Dumbbell, Activity, Zap, Heart, Star, Flag, Settings, Edit, Trash2, PlusCircle, Camera, ListChecks, UserPlus, BarChart2, Lightbulb, Users, KeyRound, LogIn, Image as ImageIconLucide, School, MessageSquarePlus, MessageSquareX, Wand2, AlertTriangle, UserCircle2, CheckCircle, Palette, Save, ShieldAlert, CheckCircle2 as CheckCircle2Icon, Target, TrendingUp, XCircle, RotateCcw, PlusSquare, Settings2, ChevronDown, CalendarIcon, MinusCircle, UploadCloud, Loader2, ChevronLeft, ChevronRight, Check, Circle, X, PanelLeft, Smile, Cat, Dog, Bird, Turtle, Rabbit, Fish, BugPlay, Sun, Moon, Rocket, Diamond, Leaf, Flower2, Cloud, Apple, Cherry, Ghost, Gamepad2, Sparkles as SparklesIcon, Pizza, ToyBrick, TreePine, CupSoda, Sandwich, Cookie,
  BookOpen, GraduationCap, FlaskConical, Atom, Brain, Globe, Microscope, Calculator, // Educational Icons
  Mail, Shuffle, Gift, Send, MessageSquare // New Icons
} from 'lucide-react'; // 필요한 아이콘들을 전부 임포트

// 아이콘 이름 충돌을 피하기 위해 일부 아이콘에 별칭 사용
export const iconMap: Record<string, LucideIcon> = {
  Footprints, Dumbbell, Activity, Zap, 
  Heart, Star: Star, Flag, Settings, Edit, Trash2, PlusCircle, Camera, ListChecks, UserPlus, BarChart2, Lightbulb, Users, KeyRound, LogIn, ImageIcon: ImageIconLucide, School, MessageSquarePlus, MessageSquareX, Wand2, AlertTriangle, UserCircle2, CheckCircle, Palette, Save, ShieldAlert, CheckCircle2: CheckCircle2Icon, Target, TrendingUp, XCircle, RotateCcw, PlusSquare, Settings2,
  ChevronDown, CalendarIcon, MinusCircle, UploadCloud, Loader2, ChevronLeft, ChevronRight, Check, Circle, X, PanelLeft,
  Smile, Cat, Dog, Bird, Turtle, Rabbit, Fish, BugPlay, Sun, Moon, Rocket, Diamond, Leaf, Flower2, Cloud, Apple, Cherry, Ghost, Gamepad2, Sparkles: SparklesIcon, Pizza, ToyBrick, TreePine, CupSoda, Sandwich, Cookie,
  BookOpen, GraduationCap, FlaskConical, Atom, Brain, Globe, Microscope, Calculator, // Added new educational icons to map
  Mail, Shuffle, Gift, Send, MessageSquare
  // 필요에 따라 여기에 더 많은 아이콘을 추가
};

export const DEFAULT_ICON_NAME = 'Activity';
export const DEFAULT_ICON = iconMap[DEFAULT_ICON_NAME] || Activity; // iconName에 해당하는 아이콘이 없을 경우 사용할 기본 아이콘

export const getIconByName = (iconName?: string | null): LucideIcon => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return DEFAULT_ICON;
};
