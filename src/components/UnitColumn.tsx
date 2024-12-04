import React from 'react';
import { Heart, Diamond, Club, Spade, Sword, Crown } from 'lucide-react';
import { Suit, ColumnState } from '../types/game';
import { cn } from '../utils/cn';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { CardExchangeButton } from './CardExchangeButton';

interface UnitColumnProps {
  suit: Suit;
  column: ColumnState;
  onCardPlace: () => void;
  isActive?: boolean;
}

export function UnitColumn({ suit, column, onCardPlace, isActive }: UnitColumnProps) {
  const { t } = useTranslation();
  const { selectedCards } = useGameStore();

  const getSuitIcon = () => {
    const iconClass = cn(
      'w-5 h-5',
      suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-700 dark:text-gray-100'
    );
    
    return (
      <div className="flex items-center gap-2">
        {/* Icône de la suite */}
        {(() => {
          switch (suit) {
            case 'hearts': return <Heart className={iconClass} />;
            case 'diamonds': return <Diamond className={iconClass} />;
            case 'clubs': return <Club className={iconClass} />;
            case 'spades': return <Spade className={iconClass} />;
          }
        })()}
        
        {/* Indicateur d'activation (Joker ou 7) */}
        {column.reserveSuit && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-sm font-bold",
                column.reserveSuit.type === 'joker'
                  ? (column.reserveSuit.color === 'red' 
                      ? "text-red-500" 
                      : "text-gray-700 dark:text-gray-300")
                  : "text-yellow-500 dark:text-yellow-400" // Style pour le 7
              )}>
                {column.reserveSuit.type === 'joker' ? 'J' : '7'}
              </span>

              {/* Enseigne pour le 7 */}
              {column.reserveSuit.value === '7' && (
                <span className={cn(
                  "text-sm",
                  column.reserveSuit.color === 'red'
                    ? "text-red-500" 
                    : "text-gray-700 dark:text-gray-300"
                )}>
                  {column.reserveSuit.suit === 'hearts' && '♥️'}
                  {column.reserveSuit.suit === 'diamonds' && '♦️'}
                  {column.reserveSuit.suit === 'clubs' && '♣️'}
                  {column.reserveSuit.suit === 'spades' && '♠️'}
                </span>
              )}
            </div>
            <CardExchangeButton 
              suit={suit}
              activatorCard={column.reserveSuit}
              column={column}
            />
          </div>
        )}
      </div>
    );
  };

  const renderCardInSlot = (value: string) => {
    const cardInSlot = column.cards.find(card => card.value === value);
    const isAs = value === 'A';
    
    return (
      <div
        key={value}
        className={cn(
          "h-7 border rounded-sm flex items-center justify-center",
          cardInSlot 
            ? "border-solid border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50" 
            : isAs && column.hasLuckyCard && cardInSlot
              ? "border-solid border-yellow-400 dark:border-yellow-500"
              : "border-dashed border-gray-300 dark:border-[#2a3041]",
          isAs && column.hasLuckyCard && cardInSlot && "ring-2 ring-yellow-400 dark:ring-yellow-500"
        )}
      >
        {cardInSlot ? (
          <span className={cn(
            "text-sm font-medium",
            cardInSlot.color === 'red' ? "text-red-500" : "text-gray-700 dark:text-gray-300"
          )}>
            {cardInSlot.value}
          </span>
        ) : (
          <span className={cn(
            "text-sm",
            isAs && column.hasLuckyCard && cardInSlot
              ? "text-yellow-500 dark:text-yellow-400 font-medium"
              : "text-gray-500 dark:text-[#404859]"
          )}>
            {value}
          </span>
        )}
      </div>
    );
  };

  const handleClick = () => {
    console.log('Column clicked:', {
      suit,
      isActive,
      hasLuckyCard: column.hasLuckyCard,
      reserveSuit: column.reserveSuit
    });
    
    if (isActive) {
      onCardPlace();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "relative bg-white dark:bg-[rgb(19,25,39)] rounded-xl overflow-hidden transition-all duration-200",
        isActive && [
          "cursor-pointer",
          "ring-2 ring-blue-400 dark:ring-blue-500",
          "shadow-lg",
          "transform hover:scale-[1.02]"
        ],
        // Effet de surbrillance quand la colonne peut être activée
        isActive && selectedCards.length === 2 && [
          "ring-4 ring-yellow-400 dark:ring-yellow-500",
          "animate-pulse"
        ]
      )}
    >
      {/* En-tête avec l'icône de la suite et le compteur */}
      <div className="flex justify-between items-center px-4 py-2.5">
        {getSuitIcon()}
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {column.cards.length}/10
        </span>
      </div>

      {/* Zone des emplacements de cartes */}
      <div className="px-4 py-2 space-y-[6px]">
        {['10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'].map(renderCardInSlot)}
      </div>

      {/* Zone Valet/Roi avec ligne de séparation */}
      <div>
        <div className="mx-4 border-t border-gray-300 dark:border-[#2a3041]" />
        <div className="grid grid-cols-2 gap-2 p-2">
          {/* Valet */}
          <div className={cn(
            "flex flex-col items-center justify-center py-2 rounded-lg",
            column.faceCards?.J 
              ? "bg-gray-100 dark:bg-gray-800" 
              : "bg-gray-50 dark:bg-[rgb(26,33,47)]"
          )}>
            <Sword className="w-4 h-4 text-gray-500 dark:text-[#404859]" />
            <span className={cn(
              "text-xs mt-1",
              column.faceCards?.J?.color === 'red' 
                ? "text-red-500" 
                : "text-gray-500 dark:text-[#404859]"
            )}>
              {column.faceCards?.J ? 'J' : 'Valet'}
            </span>
          </div>

          {/* Roi */}
          <div className={cn(
            "flex flex-col items-center justify-center py-2 rounded-lg",
            column.faceCards?.K 
              ? "bg-gray-100 dark:bg-gray-800" 
              : "bg-gray-50 dark:bg-[rgb(26,33,47)]"
          )}>
            <Crown className="w-4 h-4 text-gray-500 dark:text-[#404859]" />
            <span className={cn(
              "text-xs mt-1",
              column.faceCards?.K?.color === 'red' 
                ? "text-red-500" 
                : "text-gray-500 dark:text-[#404859]"
            )}>
              {column.faceCards?.K ? 'K' : 'Roi'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}