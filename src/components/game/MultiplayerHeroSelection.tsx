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

  if (!gameState || gameState.gamePhase !== GamePhase.HERO_SELECTION) {
    return null;
  }

  // Debug logging
  console.log('=== MultiplayerHeroSelection Debug ===');
  console.log('playerColor:', playerColor);
  console.log('gameState.players:', gameState.players);
  console.log('gamePhase:', gameState.gamePhase);

  // Get player info
  const myPlayer = gameState.players.find(p => p.color === playerColor);
  const opponentPlayer = gameState.players.find(p => p.color !== playerColor);

  console.log('myPlayer:', myPlayer);
  console.log('opponentPlayer:', opponentPlayer);

  const myHeroSelected = !!(myPlayer?.hero && myPlayer.hero.id);
  const opponentHeroSelected = !!(opponentPlayer?.hero && opponentPlayer.hero.id);

  console.log('myHeroSelected:', myHeroSelected);
  console.log('opponentHeroSelected:', opponentHeroSelected);
  console.log('=====================================');

  // Handle hero selection
  const handleHeroSelect = (hero: HeroClass) => {
    console.log('Hero clicked:', hero.name);
    console.log('myPlayer:', myPlayer);
    console.log('myHeroSelected:', myHeroSelected);

    if (!myPlayer) {
      console.error('No myPlayer found!');
      return;
    }

    // Check if already selected a hero
    if (myHeroSelected) {
      toast.error('您已选择了武将！');
      return;
    }

    // Check if hero is already taken by opponent
    if (opponentPlayer?.hero?.id === hero.id) {
      toast.error('该武将已被对手选择！');
      return;
    }

    // Select hero
    console.log('Calling selectHero with:', myPlayer.id, hero.name);
    selectHero(myPlayer.id, hero);
    toast.success(`已选择 ${hero.name}`);
  };

  // Check if hero is selected by opponent
  const isHeroSelectedByOpponent = (hero: HeroClass) => {
    return opponentPlayer?.hero?.id === hero.id;
  };

  // Check if hero is selected by me
  const isHeroSelectedByMe = (hero: HeroClass) => {
    return myPlayer?.hero?.id === hero.id;
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
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${myHeroSelected ? 'bg-green-400' : 'bg-white/30'}`} />
              <span className="font-medium">
                {playerColor === PlayerColor.RED ? '红方 (您)' : '黑方 (您)'}: {myPlayer?.hero?.name || '未选择'}
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

          {/* Current Status */}
          {!myHeroSelected && (
            <motion.div
              className="mt-3 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                请选择您的武将
              </span>
            </motion.div>
          )}

          {myHeroSelected && !opponentHeroSelected && (
            <motion.div
              className="mt-3 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                等待对手选择武将...
              </span>
            </motion.div>
          )}

          {myHeroSelected && opponentHeroSelected && (
            <motion.div
              className="mt-3 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="bg-green-400 px-4 py-2 rounded-full text-sm font-bold">
                ✓ 双方武将选择完成，游戏即将开始！
              </span>
            </motion.div>
          )}
        </div>

        {/* Hero Grid */}
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableHeroes.length === 0 && (
              <div className="col-span-3 text-center text-gray-500 py-8">
                没有可用的英雄
              </div>
            )}
            {console.log('Available heroes count:', availableHeroes.length)}
            <AnimatePresence>
              {availableHeroes.map((hero, index) => {
                const isDisabled = myHeroSelected || isHeroSelectedByOpponent(hero);
                console.log(`Hero ${hero.name}: disabled=${isDisabled}, myHeroSelected=${myHeroSelected}, opponentHas=${isHeroSelectedByOpponent(hero)}`);

                return (
                  <motion.div
                    key={hero.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <HeroCard
                      hero={hero}
                      isSelected={isHeroSelectedByMe(hero)}
                      onSelect={handleHeroSelect}
                      disabled={isDisabled}
                    />
                    {isHeroSelectedByOpponent(hero) && (
                      <div className="text-center mt-2 text-sm text-gray-500">
                        已被对手选择
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
            : '请从上方选择一位武将开始游戏'
          }
        </div>
      </div>
    </Tooltip.Provider>
  );
};
