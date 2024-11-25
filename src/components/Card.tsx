import { Heart, Diamond, Club, Spade } from 'lucide-react';
import { Card as CardType } from '../types/game';
import { cn } from '../utils/cn';
import { getCardEffect } from '../utils/cardEffects';
import { CardEffectDisplay } from './CardEffectDisplay';
import { JokerActions } from './JokerActions';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  className?: string;
  isAnimating?: boolean;
  isPlayerTurn?: boolean;
  currentHealth?: number;
  onJokerAction?: (action: 'heal' | 'attack') => void;
}

export function Card({ 
  card, 
  size = 'md', 
  onClick, 
  isSelected,
  isDisabled,
  className,
  isAnimating,
  isPlayerTurn = true,
  onJokerAction
}: CardProps) {
  const effect = getCardEffect(card);
  const isJoker = card.value === 'JOKER';
  const isRed = isJoker ? card.isRedJoker : ['hearts', 'diamonds'].includes(card.suit);

  const sizeClasses = {
    sm: 'w-12 h-20',
    md: 'w-16 h-24',
    lg: 'w-24 h-36'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getSuitIcon = (className: string) => {
    if (isJoker) return null;
    
    const iconProps = { className };
    switch (card.suit) {
      case 'hearts': return <Heart {...iconProps} />;
      case 'diamonds': return <Diamond {...iconProps} />;
      case 'clubs': return <Club {...iconProps} />;
      case 'spades': return <Spade {...iconProps} />;
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={!isDisabled ? onClick : undefined}
        disabled={isDisabled}
        className={cn(
          sizeClasses[size],
          'relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 group',
          isJoker 
            ? card.isRedJoker
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-300 dark:border-gray-700'
            : isRed 
              ? 'border-red-200 dark:border-red-900' 
              : 'border-gray-200 dark:border-gray-700',
          'transition-all duration-300',
          !isDisabled && 'hover:shadow-xl hover:-translate-y-2',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',
          isDisabled && 'opacity-50 cursor-not-allowed',
          !isDisabled && 'cursor-pointer',
          isAnimating && 'animate-cardMove',
          className
        )}
      >
        <div className="relative w-full h-full p-1">
          {/* Top value */}
          <div className="absolute top-1 left-1 flex flex-col items-center">
            <span className={cn(
              textSizes[size],
              'font-bold',
              isRed ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'
            )}>
              {card.value}
            </span>
            {!isJoker && getSuitIcon(cn(
              'w-4 h-4',
              isRed ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'
            ))}
          </div>

          {/* Center content */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {isJoker && (
              <span className="text-4xl">🎭</span>
            )}
          </div>

          {/* Bottom value */}
          <div className="absolute bottom-1 right-1 flex flex-col items-center rotate-180">
            <span className={cn(
              textSizes[size],
              'font-bold',
              isRed ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'
            )}>
              {card.value}
            </span>
            {!isJoker && getSuitIcon(cn(
              'w-4 h-4',
              isRed ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'
            ))}
          </div>

          {/* Card Effect Display */}
          {effect && <CardEffectDisplay effect={effect} />}
        </div>
      </button>

      {/* JOKER Actions */}
      {isJoker && isSelected && onJokerAction && isPlayerTurn && (
        <JokerActions
          card={card}
          onAction={onJokerAction}
          isPlayerTurn={isPlayerTurn}
        />
      )}
    </div>
  );
}