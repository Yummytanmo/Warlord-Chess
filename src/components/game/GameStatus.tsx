'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { PlayerColor, GamePhase, Move } from '@/types/game';
import {
  Clock,
  User,
  Crown,
  History,
  RotateCcw,
  Trophy,
  Swords,
  Shield,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface GameStatusProps {
  className?: string;
}

export const GameStatus: React.FC<GameStatusProps> = ({ className = '' }) => {
  const {
    gameState,
    getCurrentPlayer,
    getOpponentPlayer,
    canUndoMove,
    requestDraw,
    requestUndo,
    surrender
  } = useGameStore();

  if (!gameState) {
    return null;
  }

  const currentPlayer = getCurrentPlayer();
  const opponentPlayer = getOpponentPlayer();
  const currentPlayerData = gameState.players.find(p => p.color === currentPlayer);
  const opponentPlayerData = gameState.players.find(p => p.color === opponentPlayer);



  const formatMoveHistory = (move: Move, index: number) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isRedMove = move.piece.color === PlayerColor.RED;
    const prefix = isRedMove ? `${moveNumber}.` : `${moveNumber}...`;

    const fromPos = `${String.fromCharCode(97 + move.from.x)}${9 - move.from.y}`;
    const toPos = `${String.fromCharCode(97 + move.to.x)}${9 - move.to.y}`;
    const capture = move.capturedPiece ? 'x' : '-';

    return `${prefix} ${fromPos}${capture}${toPos}`;
  };

  const getPlayerStatusColor = (color: PlayerColor, isCurrentTurn: boolean) => {
    if (color === PlayerColor.RED) {
      return isCurrentTurn ? 'from-red-500 to-red-600' : 'from-red-300 to-red-400';
    } else {
      return isCurrentTurn ? 'from-gray-700 to-gray-800' : 'from-gray-400 to-gray-500';
    }
  };

  const getGamePhaseText = (phase: GamePhase) => {
    switch (phase) {
      case GamePhase.HERO_SELECTION:
        return '武将选择中';
      case GamePhase.PLAYING:
        return '游戏进行中';
      case GamePhase.GAME_OVER:
        return '游戏结束';
      default:
        return '未知状态';
    }
  };

  const getGamePhaseIcon = (phase: GamePhase) => {
    switch (phase) {
      case GamePhase.HERO_SELECTION:
        return <User className="w-4 h-4" />;
      case GamePhase.PLAYING:
        return <Swords className="w-4 h-4" />;
      case GamePhase.GAME_OVER:
        return <Trophy className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 space-y-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 游戏状态标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getGamePhaseIcon(gameState.gamePhase)}
          <h3 className="text-lg font-semibold text-gray-800">游戏状态</h3>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{getGamePhaseText(gameState.gamePhase)}</span>
        </div>
      </div>

      {/* 玩家信息 */}
      <div className="space-y-3">
        {/* 红方玩家 */}
        {currentPlayerData && (
          <motion.div
            className={`p-3 rounded-lg bg-gradient-to-r ${getPlayerStatusColor(
              PlayerColor.RED,
              currentPlayer === PlayerColor.RED
            )} text-white`}
            animate={{
              scale: currentPlayer === PlayerColor.RED ? 1.02 : 1,
              boxShadow: currentPlayer === PlayerColor.RED
                ? '0 4px 20px rgba(239, 68, 68, 0.3)'
                : '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">红方 - {currentPlayerData.hero.name || '未选择'}</div>
                  <div className="text-sm opacity-90">
                    {currentPlayer === PlayerColor.RED ? '当前回合' : '等待中'}
                  </div>
                </div>
              </div>

              {currentPlayer === PlayerColor.RED && (
                <motion.div
                  className="flex items-center gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Target className="w-4 h-4" />
                  <span className="text-sm">行动中</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* 黑方玩家 */}
        {opponentPlayerData && (
          <motion.div
            className={`p-3 rounded-lg bg-gradient-to-r ${getPlayerStatusColor(
              PlayerColor.BLACK,
              currentPlayer === PlayerColor.BLACK
            )} text-white`}
            animate={{
              scale: currentPlayer === PlayerColor.BLACK ? 1.02 : 1,
              boxShadow: currentPlayer === PlayerColor.BLACK
                ? '0 4px 20px rgba(55, 65, 81, 0.3)'
                : '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">黑方 - {opponentPlayerData.hero.name || '未选择'}</div>
                  <div className="text-sm opacity-90">
                    {currentPlayer === PlayerColor.BLACK ? '当前回合' : '等待中'}
                  </div>
                </div>
              </div>

              {currentPlayer === PlayerColor.BLACK && (
                <motion.div
                  className="flex items-center gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Target className="w-4 h-4" />
                  <span className="text-sm">行动中</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* 游戏结束信息 */}
      <AnimatePresence>
        {gameState.gamePhase === GamePhase.GAME_OVER && (
          <motion.div
            className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <div>
                <div className="font-bold text-lg">游戏结束！</div>
                {gameState.winner && (
                  <div className="text-sm opacity-90">
                    {gameState.winner === PlayerColor.RED ? '红方' : '黑方'}获胜
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 移动历史 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-800">移动历史</h4>
          <span className="text-sm text-gray-500">({gameState.moveHistory.length} 步)</span>
        </div>

        <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
          {gameState.moveHistory.length > 0 ? (
            <div className="space-y-1">
              {gameState.moveHistory.slice(-6).map((move, index) => {
                const actualIndex = gameState.moveHistory.length - 6 + index;
                return (
                  <motion.div
                    key={`${move.timestamp}-${actualIndex}`}
                    className="text-sm font-mono text-gray-700 flex items-center justify-between"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span>{formatMoveHistory(move, actualIndex)}</span>
                    <span className={`w-2 h-2 rounded-full ${move.piece.color === PlayerColor.RED ? 'bg-red-400' : 'bg-gray-600'
                      }`} />
                  </motion.div>
                );
              })}

              {gameState.moveHistory.length > 6 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  ... 还有 {gameState.moveHistory.length - 6} 步历史记录
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-2">
              暂无移动记录
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={requestUndo}
          disabled={!canUndoMove()}
          className="flex-1 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          悔棋
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={requestDraw}
          className="flex-1 flex items-center gap-2"
        >
          <Swords className="w-4 h-4" />
          提和
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={surrender}
          className="flex-1 flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trophy className="w-4 h-4" />
          认输
        </Button>
      </div>
    </motion.div>
  );
};