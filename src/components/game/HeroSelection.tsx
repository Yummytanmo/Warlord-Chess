'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { HeroCard } from './HeroCard';
import { HeroClass, getAllHeroes } from '@/lib/heroes';
import { PlayerColor } from '@/types/game';
import { X, Users, Swords } from 'lucide-react';
import toast from 'react-hot-toast';

interface HeroSelectionState {
  player1Hero: HeroClass | null;
  player2Hero: HeroClass | null;
  currentSelectingPlayer: PlayerColor;
}

export const HeroSelection: React.FC = () => {
  const { 
    isHeroSelectionOpen, 
    setHeroSelectionOpen,
    selectHero
  } = useGameStore();

  const [selectionState, setSelectionState] = useState<HeroSelectionState>({
    player1Hero: null,
    player2Hero: null,
    currentSelectingPlayer: PlayerColor.RED
  });

  const [availableHeroes] = useState<HeroClass[]>(getAllHeroes());

  // 重置选择状态
  const resetSelection = () => {
    setSelectionState({
      player1Hero: null,
      player2Hero: null,
      currentSelectingPlayer: PlayerColor.RED
    });
  };

  // 处理武将选择
  const handleHeroSelect = (hero: HeroClass) => {
    const { currentSelectingPlayer, player1Hero, player2Hero } = selectionState;
    
    // 检查武将是否已被选择
    if (player1Hero?.id === hero.id || player2Hero?.id === hero.id) {
      toast.error('该武将已被选择！');
      return;
    }

    if (currentSelectingPlayer === PlayerColor.RED) {
      // 红方选择
      setSelectionState(prev => ({
        ...prev,
        player1Hero: hero,
        currentSelectingPlayer: PlayerColor.BLACK
      }));
      toast.success(`红方选择了 ${hero.name}`);
    } else {
      // 黑方选择
      setSelectionState(prev => ({
        ...prev,
        player2Hero: hero
      }));
      toast.success(`黑方选择了 ${hero.name}`);
    }
  };

  // 确认选择并开始游戏
  const handleConfirmSelection = () => {
    const { player1Hero, player2Hero } = selectionState;
    
    if (!player1Hero || !player2Hero) {
      toast.error('请完成武将选择！');
      return;
    }

    // 绑定武将到玩家
    selectHero('player1', player1Hero);
    selectHero('player2', player2Hero);
    
    // 关闭对话框
    setHeroSelectionOpen(false);
    
    // 重置选择状态
    resetSelection();
    
    toast.success('武将选择完成，游戏开始！');
  };

  // 检查是否可以开始游戏
  const canStartGame = selectionState.player1Hero && selectionState.player2Hero;

  // 获取当前选择玩家的显示名称
  const getCurrentPlayerName = () => {
    return selectionState.currentSelectingPlayer === PlayerColor.RED ? '红方' : '黑方';
  };

  // 检查武将是否已被选择
  const isHeroSelected = (hero: HeroClass) => {
    return selectionState.player1Hero?.id === hero.id || selectionState.player2Hero?.id === hero.id;
  };

  // 检查武将是否被当前玩家选择
  const isHeroSelectedByCurrentPlayer = (hero: HeroClass) => {
    if (selectionState.currentSelectingPlayer === PlayerColor.RED) {
      return selectionState.player1Hero?.id === hero.id;
    } else {
      return selectionState.player2Hero?.id === hero.id;
    }
  };

  return (
    <Tooltip.Provider>
      <Dialog.Root open={isHeroSelectionOpen} onOpenChange={setHeroSelectionOpen}>
        <Dialog.Trigger asChild>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200">
            <Users className="w-5 h-5 mr-2" />
            选择武将
          </Button>
        </Dialog.Trigger>
        
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </Dialog.Overlay>
          
          <Dialog.Content asChild>
            <motion.div
              className="fixed top-1/2 left-1/2 bg-white rounded-2xl shadow-2xl max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* 头部 */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Swords className="w-8 h-8" />
                    <div>
                      <Dialog.Title className="text-2xl font-bold">
                        选择武将
                      </Dialog.Title>
                      <Dialog.Description className="text-blue-100 mt-1">
                        选择您的武将开始对战
                      </Dialog.Description>
                    </div>
                  </div>
                  
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 rounded-full"
                      onClick={resetSelection}
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </Dialog.Close>
                </div>

                {/* 选择状态指示器 */}
                <div className="mt-4 flex items-center justify-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${selectionState.player1Hero ? 'bg-green-400' : 'bg-white/30'}`} />
                    <span className="font-medium">
                      红方: {selectionState.player1Hero?.name || '未选择'}
                    </span>
                  </div>
                  
                  <div className="text-2xl">VS</div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${selectionState.player2Hero ? 'bg-green-400' : 'bg-white/30'}`} />
                    <span className="font-medium">
                      黑方: {selectionState.player2Hero?.name || '未选择'}
                    </span>
                  </div>
                </div>

                {/* 当前选择提示 */}
                {!canStartGame && (
                  <motion.div
                    className="mt-3 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={selectionState.currentSelectingPlayer}
                  >
                    <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                      请 {getCurrentPlayerName()} 选择武将
                    </span>
                  </motion.div>
                )}
              </div>

              {/* 武将网格 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {availableHeroes.map((hero, index) => (
                      <motion.div
                        key={hero.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <HeroCard
                          hero={hero}
                          isSelected={isHeroSelectedByCurrentPlayer(hero)}
                          onSelect={handleHeroSelect}
                          disabled={isHeroSelected(hero) && !isHeroSelectedByCurrentPlayer(hero)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* 底部操作区 */}
              <div className="border-t bg-gray-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {canStartGame 
                      ? '双方武将选择完成，可以开始游戏' 
                      : `等待 ${getCurrentPlayerName()} 选择武将...`
                    }
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={resetSelection}
                      disabled={!selectionState.player1Hero && !selectionState.player2Hero}
                    >
                      重新选择
                    </Button>
                    
                    <Button
                      onClick={handleConfirmSelection}
                      disabled={!canStartGame}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6"
                    >
                      开始游戏
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Tooltip.Provider>
  );
};