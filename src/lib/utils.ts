import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 游戏相关工具函数
export function positionToString(position: { x: number; y: number }): string {
  return `${position.x},${position.y}`;
}

export function stringToPosition(positionStr: string): { x: number; y: number } {
  const [x, y] = positionStr.split(',').map(Number);
  return { x, y };
}

export function isPositionEqual(pos1: { x: number; y: number }, pos2: { x: number; y: number }): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}