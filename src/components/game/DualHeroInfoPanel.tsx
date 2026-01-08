import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { PlayerColor } from '@/types/game';
import { SkillPanel } from './SkillPanel';

interface DualHeroInfoPanelProps {
    myColor: PlayerColor;
    isMyTurn: boolean;
}

export const DualHeroInfoPanel: React.FC<DualHeroInfoPanelProps> = ({
    myColor,
    isMyTurn
}) => {
    const { gameState } = useGameStore();

    if (!gameState) return null;

    const myPlayer = gameState.players.find(p => p.color === myColor);
    const opponentPlayer = gameState.players.find(p => p.color !== myColor);

    if (!myPlayer || !opponentPlayer) return null;

    return (
        <div className="space-y-6">
            {/* Opponent Panel (Top) */}
            <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-gray-400 opacity-90">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${opponentPlayer.color === PlayerColor.RED ? 'bg-red-500' : 'bg-black'}`} />
                        <h3 className="font-bold text-gray-700">
                            对方武将: {opponentPlayer.hero?.name || '未选择'}
                        </h3>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                        仅查看
                    </span>
                </div>

                {/* We reuse SkillPanel but force it to display opponent's skills in view-only mode */}
                {/* Note: SkillPanel currently pulls from store based on current player. 
            We need to modify SkillPanel to accept a specific playerId or we need to mock the store context for it.
            Better approach: Modify SkillPanel to accept optional playerId/hero.
        */}
                <SkillPanel
                    playerId={opponentPlayer.id}
                    viewOnly={true}
                    compact={true}
                />
            </div>

            {/* My Panel (Bottom) */}
            <div className={`bg-white rounded-xl shadow-lg p-4 border-l-4 ${myColor === PlayerColor.RED ? 'border-red-500' : 'border-gray-800'
                } ${isMyTurn ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${myColor === PlayerColor.RED ? 'bg-red-500' : 'bg-black'}`} />
                        <h3 className="font-bold text-gray-800">
                            我的武将: {myPlayer.hero?.name || '未选择'}
                        </h3>
                    </div>
                    {isMyTurn && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium animate-pulse">
                            当前回合
                        </span>
                    )}
                </div>

                <SkillPanel
                    playerId={myPlayer.id}
                    viewOnly={!isMyTurn}
                />
            </div>
        </div>
    );
};
