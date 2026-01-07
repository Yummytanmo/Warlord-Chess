'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/gameStore';
import { Position, SkillType } from '@/types/game';

// Dynamically import Konva components
const Circle = dynamic(() => import('react-konva').then(mod => ({ default: mod.Circle })), { ssr: false });
const Rect = dynamic(() => import('react-konva').then(mod => ({ default: mod.Rect })), { ssr: false });
const Group = dynamic(() => import('react-konva').then(mod => ({ default: mod.Group })), { ssr: false });

interface SkillEffect {
  id: string;
  type: 'skill_activation' | 'move_enhancement' | 'special_ability';
  position: Position;
  skillType: SkillType;
  duration: number;
  timestamp: number;
}

interface SkillEffectsProps {
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

export const SkillEffects: React.FC<SkillEffectsProps> = ({
  cellSize,
  offsetX,
  offsetY
}) => {
  const { gameState } = useGameStore();
  const [activeEffects, setActiveEffects] = React.useState<SkillEffect[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // 清理过期的特效
  React.useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveEffects(prev => 
        prev.filter(effect => now - effect.timestamp < effect.duration)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isClient]);

  // 监听技能使用，添加特效
  React.useEffect(() => {
    // 这里可以监听游戏状态变化，添加技能特效
    // 实际实现中需要从游戏状态或事件系统中获取技能使用信息
  }, [gameState]);

  if (!isClient) {
    return null;
  }

  const getEffectColor = (skillType: SkillType) => {
    switch (skillType) {
      case SkillType.PASSIVE:
        return '#10b981'; // green
      case SkillType.ACTIVE:
        return '#3b82f6'; // blue
      case SkillType.LIMITED:
        return '#8b5cf6'; // purple
      case SkillType.AWAKENING:
        return '#f59e0b'; // orange
      default:
        return '#6b7280'; // gray
    }
  };

  const renderSkillActivationEffect = (effect: SkillEffect) => {
    const x = offsetX + effect.position.x * cellSize + cellSize / 2;
    const y = offsetY + effect.position.y * cellSize + cellSize / 2;
    const progress = (Date.now() - effect.timestamp) / effect.duration;
    const opacity = Math.max(0, 1 - progress);
    const scale = 1 + progress * 2;

    return (
      <Group key={effect.id}>
        {/* 外圈光环 */}
        <Circle
          x={x}
          y={y}
          radius={cellSize * 0.8 * scale}
          fill={getEffectColor(effect.skillType)}
          opacity={opacity * 0.3}
        />
        
        {/* 内圈光环 */}
        <Circle
          x={x}
          y={y}
          radius={cellSize * 0.5 * scale}
          fill={getEffectColor(effect.skillType)}
          opacity={opacity * 0.6}
        />
        
        {/* 中心光点 */}
        <Circle
          x={x}
          y={y}
          radius={cellSize * 0.2}
          fill="#ffffff"
          opacity={opacity}
        />
      </Group>
    );
  };

  const renderMoveEnhancementEffect = (effect: SkillEffect) => {
    const x = offsetX + effect.position.x * cellSize;
    const y = offsetY + effect.position.y * cellSize;
    const progress = (Date.now() - effect.timestamp) / effect.duration;
    const opacity = Math.max(0, 1 - progress);

    return (
      <Group key={effect.id}>
        {/* 边框高亮 */}
        <Rect
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          stroke={getEffectColor(effect.skillType)}
          strokeWidth={3}
          opacity={opacity}
        />
        
        {/* 闪烁效果 */}
        <Rect
          x={x + 2}
          y={y + 2}
          width={cellSize - 4}
          height={cellSize - 4}
          fill={getEffectColor(effect.skillType)}
          opacity={opacity * 0.2 * (1 + Math.sin(progress * Math.PI * 8)) / 2}
        />
      </Group>
    );
  };

  const renderSpecialAbilityEffect = (effect: SkillEffect) => {
    const x = offsetX + effect.position.x * cellSize + cellSize / 2;
    const y = offsetY + effect.position.y * cellSize + cellSize / 2;
    const progress = (Date.now() - effect.timestamp) / effect.duration;
    const opacity = Math.max(0, 1 - progress);

    // 创建粒子效果
    const particles = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const distance = cellSize * 0.5 * progress;
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;

      return (
        <Circle
          key={i}
          x={particleX}
          y={particleY}
          radius={3}
          fill={getEffectColor(effect.skillType)}
          opacity={opacity}
        />
      );
    });

    return (
      <Group key={effect.id}>
        {particles}
        
        {/* 中心爆发效果 */}
        <Circle
          x={x}
          y={y}
          radius={cellSize * 0.3 * (1 - progress)}
          fill={getEffectColor(effect.skillType)}
          opacity={opacity * 0.5}
        />
      </Group>
    );
  };

  const renderEffect = (effect: SkillEffect) => {
    switch (effect.type) {
      case 'skill_activation':
        return renderSkillActivationEffect(effect);
      case 'move_enhancement':
        return renderMoveEnhancementEffect(effect);
      case 'special_ability':
        return renderSpecialAbilityEffect(effect);
      default:
        return null;
    }
  };

  // 公共方法：添加技能特效
  const addSkillEffect = React.useCallback((
    type: SkillEffect['type'],
    position: Position,
    skillType: SkillType,
    duration: number = 1000
  ) => {
    const effect: SkillEffect = {
      id: `effect_${Date.now()}_${Math.random()}`,
      type,
      position,
      skillType,
      duration,
      timestamp: Date.now()
    };

    setActiveEffects(prev => [...prev, effect]);
  }, []);

  // 暴露添加特效的方法给父组件
  React.useImperativeHandle(null, () => ({
    addSkillEffect
  }), [addSkillEffect]);

  return (
    <>
      {activeEffects.map(renderEffect)}
    </>
  );
};

// 创建一个 React 组件包装器用于 Framer Motion 动画
export const MotionSkillEffects: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </motion.div>
  );
};