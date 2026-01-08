'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useGameStore } from '@/store/gameStore';
import { HeroCard } from './HeroCard';
import { HeroClass, getAllHeroes } from '@/lib/heroes';
import { PlayerColor, GamePhase } from '@/types/game';
import { Swords } from 'lucide-react';
import toast from 'react-hot-toast';

interface MultiplayerHeroSelectionProps {
  playerColor: PlayerColor;
}

export const MultiplayerHeroSelection: React.FC<MultiplayerHeroSelectionProps> = ({ playerColor }) => {
  const { gameState, selectHero } = useGameStore();
  const [availableHeroes] = useState<HeroClass[]>(getAllHeroes());
  const [previewHero, setPreviewHero] = useState<HeroClass | null>(null);

  if (!gameState || gameState.gamePhase !== GamePhase.HERO_SELECTION) {
    return null;
  }

  // Get player info
  const myPlayer = gameState.players.find(p => p.color === playerColor);
  const opponentPlayer = gameState.players.find(p => p.color !== playerColor);

  const myHeroSelected = !!(myPlayer?.hero && myPlayer.hero.id);
  const opponentHeroSelected = !!(opponentPlayer?.hero && opponentPlayer.hero.id);

  // Handle hero preview
  const handleHeroSelect = (hero: HeroClass) => {
    if (!myPlayer) return;

    // If already confirmed, do nothing
    if (myHeroSelected) {
      toast.error('您已选择了武将！');
      return;
    }

    setPreviewHero(hero);
  };

  // Confirm selection
  const handleConfirmSelection = () => {
    if (!myPlayer || !previewHero) return;

    selectHero(myPlayer.id, previewHero);
    toast.success(`已选择 ${previewHero.name}`);
    setPreviewHero(null);
  };

  // Check if hero is selected by opponent
  const isHeroSelectedByOpponent = (hero: HeroClass) => {
    return opponentPlayer?.hero?.id === hero.id;
  };

  // Check if hero is selected by me (confirmed)
  const isHeroSelectedByMe = (hero: HeroClass) => {
    return myPlayer?.hero?.id === hero.id;
  };

  // Check if hero is currently previewed
  const isHeroPreviewed = (hero: HeroClass) => {
    return previewHero?.id === hero.id;
  };

  return (
    <Tooltip.Provider>
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Swords className="w-8 h-8" />
            <h2 className="text-2xl font-bold">选择武将</h2>
          </div>

          {/* Selection Status */}
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${myHeroSelected ? 'bg-green-400' : 'bg-white/30'}`} />
              <span className="font-medium">
                {playerColor === PlayerColor.RED ? '红方 (您)' : '黑方 (您)'}: {myPlayer?.hero?.name || (previewHero ? `预览: ${previewHero.name}` : '未选择')}
              </span>
            </div>

            <div className="text-2xl">VS</div>

            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${opponentHeroSelected ? 'bg-green-400' : 'bg-white/30'}`} />
              <span className="font-medium">
                {playerColor === PlayerColor.RED ? '黑方 (对手)' : '红方 (对手)'}: {opponentPlayer?.hero?.name || '等待中...'}
              </span>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex justify-center h-12">
            <AnimatePresence mode="wait">
              {!myHeroSelected && !previewHero && (
                <motion.div
                  key="instruction"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center"
                >
                  <span className="bg-white/20 px-6 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                    请点击下方卡片选择您的武将
                  </span>
                </motion.div>
              )}

              {!myHeroSelected && previewHero && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-4"
                >
                  <span className="text-sm font-medium">
                    已选择: {previewHero.name}
                  </span>
                  <button
                    onClick={handleConfirmSelection}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95"
                  >
                    确认选择
                  </button>
                </motion.div>
              )}

              {myHeroSelected && !opponentHeroSelected && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center"
                >
                  <span className="bg-white/20 px-6 py-2 rounded-full text-sm font-medium animate-pulse">
                    等待对手选择武将...
                  </span>
                </motion.div>
              )}

              {myHeroSelected && opponentHeroSelected && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center"
                >
                  <span className="bg-green-400 px-6 py-2 rounded-full text-sm font-bold shadow-lg text-green-900">
                    ✓ 双方准备就绪，游戏开始！
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Hero Grid */}
        <div className="overflow-y-auto max-h-[60vh] p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableHeroes.length === 0 && (
              <div className="col-span-3 text-center text-gray-500 py-8">
                没有可用的英雄
              </div>
            )}
            <AnimatePresence>
              {availableHeroes.map((hero, index) => {
                const isConfirmed = isHeroSelectedByMe(hero);
                const isPreview = isHeroPreviewed(hero);
                // Only disable if I have already confirmed a selection
                // We NO LONGER disable if opponent selected it (allow same hero)
                const isDisabled = myHeroSelected && !isConfirmed;

                return (
                  <motion.div
                    key={hero.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative rounded-xl transition-all duration-300 ${isPreview ? 'ring-4 ring-blue-500 ring-offset-2 scale-[1.02]' : ''
                      }`}
                  >
                    <HeroCard
                      hero={hero}
                      isSelected={isConfirmed || isPreview}
                      onSelect={handleHeroSelect}
                      disabled={isDisabled}
                    />
                    {isHeroSelectedByOpponent(hero) && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-md z-10">
                        对手已选
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {myHeroSelected && opponentHeroSelected
            ? '双方武将选择完成，游戏将自动开始'
            : myHeroSelected
              ? '您已选择武将，等待对手...'
              : '请从上方选择一位武将，点击确认开始游戏'
          }
        </div>
      </div>
    </Tooltip.Provider>
  );
};
