'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { Skill, SkillType, PlayerColor } from '@/types/game';
import { Zap, Lock, Star, Clock, Sparkles } from 'lucide-react';

interface SkillPanelProps {
  className?: string;
}

export const SkillPanel: React.FC<SkillPanelProps> = ({ className = '' }) => {
  const { 
    gameState, 
    useSkill, 
    getAvailableSkills,
    getCurrentPlayer 
  } = useGameStore();

  const currentPlayer = getCurrentPlayer();
  const availableSkills = getAvailableSkills();

  if (!gameState || !currentPlayer) {
    return null;
  }

  const currentPlayerData = gameState.players.find(p => p.color === currentPlayer);
  if (!currentPlayerData) {
    return null;
  }

  const handleSkillUse = (skillId: string) => {
    useSkill(skillId);
  };

  const getSkillIcon = (skillType: SkillType) => {
    switch (skillType) {
      case SkillType.PASSIVE:
        return <Sparkles className="w-4 h-4" />;
      case SkillType.ACTIVE:
        return <Zap className="w-4 h-4" />;
      case SkillType.LIMITED:
        return <Star className="w-4 h-4" />;
      case SkillType.AWAKENING:
        return <Clock className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getSkillTypeColor = (skillType: SkillType) => {
    switch (skillType) {
      case SkillType.PASSIVE:
        return 'from-green-500 to-emerald-600';
      case SkillType.ACTIVE:
        return 'from-blue-500 to-cyan-600';
      case SkillType.LIMITED:
        return 'from-purple-500 to-violet-600';
      case SkillType.AWAKENING:
        return 'from-orange-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getSkillTypeText = (skillType: SkillType) => {
    switch (skillType) {
      case SkillType.PASSIVE:
        return '被动';
      case SkillType.ACTIVE:
        return '主动';
      case SkillType.LIMITED:
        return '限定';
      case SkillType.AWAKENING:
        return '觉醒';
      default:
        return '未知';
    }
  };

  const isSkillAvailable = (skill: Skill) => {
    return availableSkills.some(s => s.id === skill.id);
  };

  const isSkillUsed = (skill: Skill) => {
    return skill.isUsed;
  };

  return (
    <Tooltip.Provider>
      <motion.div
        className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* 面板标题 */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${currentPlayer === PlayerColor.RED ? 'bg-red-500' : 'bg-gray-800'}`} />
          <h3 className="text-lg font-semibold text-gray-800">
            {currentPlayerData.hero.name || '未选择'} - 技能面板
          </h3>
        </div>

        {/* 技能列表 */}
        <div className="space-y-3">
          <AnimatePresence>
            {currentPlayerData.hero.skills.map((skill, index) => {
              const available = isSkillAvailable(skill);
              const used = isSkillUsed(skill);
              const canUse = available && !used;
              const isPassive = skill.type === SkillType.PASSIVE;
              const clickable = canUse && !isPassive;

              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Button
                        variant={canUse ? "default" : "outline"}
                        onClick={() => clickable && handleSkillUse(skill.id)}
                        disabled={!canUse}
                        className={`w-full justify-start p-4 h-auto relative overflow-hidden group transition-all duration-200 ${
                          canUse
                            ? `bg-gradient-to-r ${getSkillTypeColor(skill.type)}` 
                            : 'bg-gray-100 text-gray-500'
                        } ${
                          clickable 
                            ? 'hover:shadow-lg transform hover:scale-[1.02] cursor-pointer' 
                            : canUse 
                              ? 'cursor-default' 
                              : 'cursor-not-allowed'
                        }`}
                      >
                        {/* 技能图标和名称 */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${canUse ? 'bg-white/20' : 'bg-gray-200'}`}>
                            {getSkillIcon(skill.type)}
                          </div>
                          
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{skill.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                canUse ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-600'
                              }`}>
                                {getSkillTypeText(skill.type)}
                              </span>
                            </div>
                          </div>

                          {/* 状态指示器 */}
                          <div className="flex items-center gap-2">
                            {used && (
                              <div className="flex items-center gap-1 text-xs">
                                <Lock className="w-3 h-3" />
                                <span>已使用</span>
                              </div>
                            )}
                            
                            {skill.type === SkillType.AWAKENING && !currentPlayerData.hero.awakened && (
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>未觉醒</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 技能特效动画 */}
                        {clickable && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                              ease: "linear"
                            }}
                          />
                        )}
                      </Button>
                    </Tooltip.Trigger>
                    
                    <Tooltip.Content
                      className="max-w-xs p-3 bg-gray-900 text-white rounded-lg shadow-xl"
                      sideOffset={5}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{skill.name}</span>
                          <span className="text-xs px-2 py-1 bg-white/20 rounded-full">
                            {getSkillTypeText(skill.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {skill.description}
                        </p>
                        
                        {/* 技能状态信息 */}
                        <div className="pt-2 border-t border-gray-700">
                          <div className="flex items-center justify-between text-xs">
                            <span>状态:</span>
                            <span className={used ? 'text-red-400' : canUse ? 'text-green-400' : 'text-yellow-400'}>
                              {used ? '已使用' : canUse ? '可用' : '不可用'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Root>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 技能使用提示 */}
        {availableSkills.length === 0 && (
          <motion.div
            className="mt-4 p-3 bg-gray-50 rounded-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-gray-600">当前没有可用技能</p>
          </motion.div>
        )}
      </motion.div>
    </Tooltip.Provider>
  );
};