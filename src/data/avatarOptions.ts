
import type { LucideIcon } from 'lucide-react';
import { 
  Smile, Cat, Dog, Bird, Turtle, Rabbit, Fish, BugPlay, Star, Sun, Moon, Rocket, Diamond, Leaf, Flower2, Heart, Cloud, Apple, Cherry, Ghost, Gamepad2, Sparkles, Pizza, ToyBrick, TreePine, CupSoda, Sandwich, Cookie
} from 'lucide-react';

export interface AvatarOption {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'smile', name: '웃는 얼굴', icon: Smile },
  { id: 'cat', name: '고양이', icon: Cat },
  { id: 'dog', name: '강아지', icon: Dog },
  { id: 'bird', name: '새', icon: Bird },
  { id: 'turtle', name: '거북이', icon: Turtle },
  { id: 'rabbit', name: '토끼', icon: Rabbit },
  { id: 'fish', name: '물고기', icon: Fish },
  { id: 'bug', name: '벌레', icon: BugPlay },
  { id: 'star', name: '별', icon: Star },
  { id: 'sun', name: '해', icon: Sun },
  { id: 'moon', name: '달', icon: Moon },
  { id: 'rocket', name: '로켓', icon: Rocket },
  { id: 'diamond', name: '다이아몬드', icon: Diamond },
  { id: 'leaf', name: '나뭇잎', icon: Leaf },
  { id: 'flower', name: '꽃', icon: Flower2 },
  { id: 'heart', name: '하트', icon: Heart },
  { id: 'cloud', name: '구름', icon: Cloud },
  { id: 'apple', name: '사과', icon: Apple },
  { id: 'cherry', name: '체리', icon: Cherry },
  { id: 'ghost', name: '유령', icon: Ghost },
  { id: 'gamepad', name: '게임패드', icon: Gamepad2 },
  { id: 'sparkles', name: '반짝이', icon: Sparkles },
  { id: 'pizza', name: '피자', icon: Pizza },
  { id: 'brick', name: '블록', icon: ToyBrick },
  { id: 'tree', name: '나무', icon: TreePine },
  { id: 'soda', name: '음료수', icon: CupSoda },
  { id: 'sandwich', name: '샌드위치', icon: Sandwich },
  { id: 'cookie', name: '쿠키', icon: Cookie },
];
