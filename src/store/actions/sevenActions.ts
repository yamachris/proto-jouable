import { StateCreator } from 'zustand';
import { Card, GameStore } from '../../types/game';
import { t } from 'i18next';

export const createSevenActions: StateCreator<GameStore> = (set) => ({
  handleSevenAction: (sevenCard: Card) => {
    set((state) => {
      console.log('=== DÉBUT HANDLE SEVEN ACTION ===');
      console.log('État initial:', {
        sevenCard,
        mainJoueur: state.currentPlayer.hand,
        reserveJoueur: state.currentPlayer.reserve,
        phase: state.phase,
        hasPlayedAction: state.hasPlayedAction
      });

      if (sevenCard.value !== '7' || state.hasPlayedAction || state.phase !== 'action') {
        console.log('Conditions non remplies pour le 7:', {
          estUn7: sevenCard.value === '7',
          aDejaJoue: state.hasPlayedAction,
          phaseAction: state.phase === 'action'
        });
        return state;
      }

      // 1. Vérifier d'où vient le 7
      const isFromHand = state.currentPlayer.hand.some((c: Card) => c.id === sevenCard.id);
      console.log('7 vient de la main?', isFromHand);
      
      // 2. Trouver la colonne correspondante et la carte existante
      const targetColumn = state.columns[sevenCard.suit];
      const existingActivator = targetColumn?.reserveSuit;
      console.log('Carte existante dans reserveSuit:', existingActivator);

      // 3. Copier les mains actuelles
      let updatedHand = [...state.currentPlayer.hand];
      let updatedReserve = [...state.currentPlayer.reserve];

      // 4. Retirer le 7 de son emplacement d'origine
      if (isFromHand) {
        updatedHand = updatedHand.filter((c: Card) => c.id !== sevenCard.id);
      } else {
        updatedReserve = updatedReserve.filter((c: Card) => c.id !== sevenCard.id);
      }

      // 5. Si il y a une carte dans reserveSuit, l'ajouter à la main ou la réserve
      if (existingActivator) {
        if (isFromHand) {
          updatedHand.push(existingActivator);
        } else {
          updatedReserve.push(existingActivator);
        }
      }

      console.log('Après modifications:', {
        mainModifiee: updatedHand,
        reserveModifiee: updatedReserve,
        carteExistante: existingActivator,
        nouveauReserveSuit: sevenCard
      });

      // 6. Créer le nouvel état
      const newState = {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: updatedHand,
          reserve: updatedReserve
        },
        columns: {
          ...state.columns,
          [sevenCard.suit]: {
            ...targetColumn,
            reserveSuit: sevenCard,
            activatorType: '7',
            isReserveBlocked: true
          }
        },
        selectedCards: [],
        hasPlayedAction: true,
        playedCardsLastTurn: 1,
        message: existingActivator 
          ? `Échange effectué : le 7 est placé et la carte ${existingActivator.value} est récupérée`
          : "Le 7 est placé en position d'activateur",
        canEndTurn: true,
        phase: 'action'
      };

      console.log('État final:', {
        mainFinale: newState.currentPlayer.hand,
        reserveFinale: newState.currentPlayer.reserve,
        colonneReserveSuit: newState.columns[sevenCard.suit].reserveSuit
      });
      console.log('=== FIN HANDLE SEVEN ACTION ===');

      return newState;
    });
  }
});
