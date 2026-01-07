'use client';

import React from 'react';
import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HeroClass } from '@/lib/heroes';
import { SkillType } from '@/types/game';
import { Crown, Zap, Star, Shield } from 'lucide-react';

interface HeroCardProps {
  hero: HeroClass;
  isSelected?: boolean;
  onSelect?: (hero: HeroClass) => void;
  disabled?: boolean;
}

// 技能类型图标映射
const getSkillIcon = (type: SkillType) => {
  switch (type) {
    case SkillType.PASSIVE:
      return <Shield className="w-3 h-3" />;
    case SkillType.ACTIVE:
      return <Zap className="w-3 h-3" />;
    case SkillType.LIMITED:
      return <Star className="w-3 h-3" />;
    case SkillType.AWAKENING:
      return <Crown className="w-3 h-3" />;
    default:
      return <Zap className="w-3 h-3" />;
  }
};

// 技能类型颜色映射
const getSkillColor = (type: SkillType) => {
  switch (type) {
    case SkillType.PASSIVE:
      return 'text-blue-600 bg-blue-50';
    case SkillType.ACTIVE:
      return 'text-green-600 bg-green-50';
    case SkillType.LIMITED:
      return 'text-purple-600 bg-purple-50';
    case SkillType.AWAKENING:
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const HeroCard: React.FC<HeroCardProps> = ({
  hero,
  isSelected = false,
  onSelect,
  disabled = false
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(hero);
    }
  };

  return (
    <motion.div
      className={`
        relative bg-white rounded-xl border-2 p-4 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={handleClick}
      whileHover={disabled ? {} : { 
        scale: 1.02,
        y: -2
      }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 选中指示器 */}
      {isSelected && (
        <motion.div
          className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Crown className="w-3 h-3 text-white" />
        </motion.div>
      )}

      {/* 武将头像区域 */}
      <div className="relative mb-3">
        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          {hero.avatar ? (
            <img 
              src={hero.avatar} 
              alt={hero.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 如果图片加载失败，显示默认内容
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-4xl font-bold text-gray-400">
              {hero.name.charAt(0)}
            </div>
          )}
        </div>
        
        {/* 武将名称 */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-white px-3 py-1 rounded-full border-2 border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800">{hero.name}</h3>
          </div>
        </div>
      </div>

      {/* 武将描述 */}
      {hero.description && (
        <p className="text-sm text-gray-600 mb-3 mt-4 overflow-hidden" style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {hero.description}
        </p>
      )}

      {/* 技能列表 */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">技能</h4>
        {hero.skills.map((skill, index) => (
          <Tooltip.Root key={skill.id} delayDuration={300}>
            <Tooltip.Trigger asChild>
              <motion.div
                className={`
                  flex items-center gap-2 p-2 rounded-lg text-xs
                  ${getSkillColor(skill.type)}
                  hover:shadow-sm transition-shadow
                `}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {getSkillIcon(skill.type)}
                <span className="font-medium">{skill.name}</span>
                <span className="ml-auto text-xs opacity-70">
                  {skill.type === SkillType.PASSIVE && '被动'}
                  {skill.type === SkillType.ACTIVE && '主动'}
                  {skill.type === SkillType.LIMITED && '限定'}
                  {skill.type === SkillType.AWAKENING && '觉醒'}
                </span>
              </motion.div>
            </Tooltip.Trigger>
            
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs z-50"
                sideOffset={5}
              >
                <div className="space-y-1">
                  <div className="font-semibold">{skill.name}</div>
                  <div className="text-sm opacity-90">{skill.description}</div>
                </div>
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>

      {/* 悬浮效果 */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 pointer-events-none"
        animate={{ opacity: isSelected ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};