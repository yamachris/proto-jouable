import { Card, Player, Phase } from '../types/game';

export function shouldSkipDiscard(playedCardsLastTurn: number): boolean {
  return playedCardsLastTurn > 0;
}

export function calculateMissingCards(player: Player): number {
  const totalCards = player.hand.length + player.reserve.length;
  return Math.max(0, 7 - totalCards);
}

export function canExchangeCard(): boolean {
  return true;
}

export function handleJokerHeal(player: Player): Player {
  const newHealth = player.health + 3;
  return {
    ...player,
    health: newHealth,
    maxHealth: newHealth
  };
}

export function getNextPhase(currentPhase: Phase): Phase {
  const phases: Phase[] = ['discard', 'draw', 'action'];
  const currentIndex = phases.indexOf(currentPhase);
  return phases[(currentIndex + 1) % phases.length];
}

export function getPhaseMessage(phase: Phase, hasDiscarded: boolean, hasDrawn: boolean, hasPlayedAction: boolean): string {
  switch (phase) {
    case 'discard':
      return hasDiscarded ? '' : "Défaussez une carte pour continuer";
    case 'draw':
      return "Piochez une carte pour continuer";
    case 'action':
      return "Phase d'action - Vous pouvez jouer ou passer";
    default:
      return '';
  }
}