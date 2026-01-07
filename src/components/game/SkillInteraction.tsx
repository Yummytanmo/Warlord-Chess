import React, { useState } from 'react';
import { Position } from '@/types/game';
import { Button } from '@/components/ui/button';

interface SkillInteractionProps {
  skillId: string;
  maxSelections?: number;
  onConfirm: (payload: any) => void;
  onCancel: () => void;
  description?: string;
}

export const SkillInteraction: React.FC<SkillInteractionProps> = ({ 
  skillId, 
  maxSelections = 1, 
  onConfirm, 
  onCancel,
  description 
}) => {
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);

  const handlePositionSelect = (pos: Position) => {
    if (selectedPositions.some(p => p.x === pos.x && p.y === pos.y)) {
      setSelectedPositions(prev => prev.filter(p => p.x !== pos.x || p.y !== pos.y));
    } else {
      if (selectedPositions.length < maxSelections) {
        setSelectedPositions(prev => [...prev, pos]);
      }
    }
  };

  const handleConfirm = () => {
    onConfirm({ positions: selectedPositions });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">技能交互: {skillId}</h3>
        {description && <p className="mb-4 text-gray-600">{description}</p>}
        
        <div className="mb-4">
          <p>已选择位置: {selectedPositions.length} / {maxSelections}</p>
          <ul className="list-disc pl-5">
            {selectedPositions.map((pos, idx) => (
              <li key={idx}>{`(${pos.x}, ${pos.y})`}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>取消</Button>
          <Button onClick={handleConfirm} disabled={selectedPositions.length === 0}>确认</Button>
        </div>
      </div>
    </div>
  );
};
