'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { Hero } from '@/types/game';

export const HeroSelection: React.FC = () => {
  const { 
    isHeroSelectionOpen, 
    availableHeroes, 
    setHeroSelectionOpen,
    selectHero 
  } = useGameStore();

  const handleHeroSelect = (hero: Hero) => {
    // TODO: 实现武将选择逻辑
    selectHero('player1', hero.id);
    setHeroSelectionOpen(false);
  };

  return (
    <Dialog.Root open={isHeroSelectionOpen} onOpenChange={setHeroSelectionOpen}>
      <Dialog.Trigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
          选择武将
        </Button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-2xl font-bold mb-4">
            选择武将
          </Dialog.Title>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableHeroes.map((hero) => (
              <div
                key={hero.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleHeroSelect(hero)}
              >
                <h3 className="font-semibold text-lg">{hero.name}</h3>
                <div className="mt-2 space-y-1">
                  {hero.skills.map((skill) => (
                    <div key={skill.id} className="text-sm text-gray-600">
                      <span className="font-medium">{skill.name}</span>
                      <p className="text-xs">{skill.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <Dialog.Close asChild>
            <Button variant="outline" className="mt-4">
              取消
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};