import { StateCreator } from 'zustand';
import { Card, GameStore } from '../../types/game';
import { t } from 'i18next';

export const createExchangeActions: StateCreator<GameStore> = (set) => ({
  handleActivatorExchange: (suit: string, columnCard: Card, playerCard: Card) => {
    set((state) => {
      if (state.phase !== 'action' || state.hasPlayedAction) return state;

      const isActivator = (card: Card) => card.type === 'joker' || card.value === '7';
      if (!isActivator(columnCard) || !isActivator(playerCard)) {
        return state;
      }

      // Empêcher l'échange de cartes identiques
      if (columnCard.value === playerCard.value && columnCard.suit === playerCard.suit) {
        return {
          ...state,
          message: 'Impossible d\'échanger deux cartes identiques'
        };
      }

      // Empêcher l'échange de deux JOKER de la même couleur
      if (columnCard.type === 'joker' && playerCard.type === 'joker' && 
          columnCard.color === playerCard.color) {
        return {
          ...state,
          message: 'Impossible d\'échanger deux JOKER de la même couleur'
        };
      }

      // Trouver la colonne qui contient la carte à échanger
      const targetColumn = Object.values(state.columns).find(col => 
        col.reserveSuit?.id === columnCard.id
      );

      if (!targetColumn) return state;

      // Retirer la carte du joueur de sa main ou réserve
      const isInHand = state.currentPlayer.hand.some(c => c.id === playerCard.id);
      const newHand = state.currentPlayer.hand.filter(c => c.id !== playerCard.id);
      const newReserve = state.currentPlayer.reserve.filter(c => c.id !== playerCard.id);

      // Placer la carte de la colonne dans la main ou la réserve selon l'origine
      if (isInHand) {
        newHand.push(columnCard);
      } else {
        newReserve.push(columnCard);
      }

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve
        },
        columns: {
          ...state.columns,
          [suit]: {
            ...targetColumn,
            reserveSuit: playerCard
          }
        },
        selectedCards: [],
        hasPlayedAction: true,
        message: t('game.messages.cardPlaced')
      };
    });
  }
});
