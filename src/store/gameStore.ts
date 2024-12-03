// Importation des dépendances nécessaires
import { create, } from 'zustand'; // Zustand est utilisé pour la gestion d'état
import { Card, Player, Phase, Suit, ColumnState } from '../types/game';
import { createDeck, drawCards, shuffleDeck } from '../utils/deck';
import { handleCardPlacement, handleJokerAction as handleJokerEffect, distributeCards } from '../utils/gameLogic';
import i18next from 'i18next';  // Importez i18next directement
import i18n from '../i18n/config';
import { createColumnActions } from './slices/columnActions';
import { createSevenActions } from './actions/sevenActions';
import { createExchangeActions } from './actions/exchangeActions';

// Au début du fichier, après les autres imports
const t = (key: string) => i18next.t(key);

// Interface définissant la structure de l'état du jeu
interface GameState {
  currentPlayer: Player;      // Joueur actuel
  deck: Card[];              // Paquet de cartes
  phase: Phase;              // Phase actuelle du jeu
  turn: number;              // Numéro du tour
  selectedCards: Card[];     // Cartes sélectionnées
  columns: Record<Suit, ColumnState>;  // État des colonnes par couleur
  hasDiscarded: boolean;     // Indique si le joueur a défaussé
  hasDrawn: boolean;         // Indique si le joueur a pioché
  hasPlayedAction: boolean;  // Indique si le joueur a joué une action
  isGameOver: boolean;       // Indique si la partie est terminée
  playedCardsLastTurn: number; // Nombre de cartes jouées au dernier tour
  attackMode: boolean;
  message: string;
  hasUsedFirstStrategicShuffle: boolean;
  awaitingStrategicShuffleConfirmation: boolean;
  language: string;
  winner: string | null;
  canEndTurn: boolean;
  queenChallenge: {
    isActive: boolean;
    queen: Card | null;
  };
  isMessageClickable: boolean;
  exchangeMode: boolean;
  selectedForExchange: Card | null;
  nextPhase: Phase | null; // Stocke la prochaine phase
}

// Ajout du type pour le store complet
export interface GameStore extends GameState {
  selectCard: (card: CardType) => void;
  handleDiscard: (card: CardType) => void;
  handleDrawCard: () => void;
  exchangeCards: (card1: CardType, card2: CardType) => void;
  handleJokerAction: (joker: CardType, action: 'heal' | 'attack') => void;
  setAttackMode: (mode: boolean) => void;
  setMessage: (message: string) => void;
  handleStrategicShuffle: () => void;
  endTurn: () => void;
  setPhase: (phase: Phase) => void;
  canUseStrategicShuffle: () => boolean;
  confirmStrategicShuffle: () => void;
  getState: () => GameStore;
  handleCardPlace: (suit: Suit, position: number) => void;
  handleQueenChallenge: (isCorrect: boolean) => void;
  handleCardExchange: (columnCard: Card, playerCard: Card) => void;
  getPhaseMessage: (phase: Phase, hasDiscarded: boolean, hasDrawn: boolean, hasPlayedAction: boolean, playedCardsLastTurn: number) => string;
  handleSevenAction: (sevenCard: Card) => void;
}

// Création du store avec Zustand
export const useGameStore = create<GameStore>((set, get) => ({
  // État initial du jeu
  currentPlayer: {
    id: 'player-1',
    name: 'Joueur 1',
    health: 10,
    maxHealth: 10,
    hand: [],
    reserve: [],
    discardPile: [],
    deck: [],
    hasUsedStrategicShuffle: false,
    profile: {
      epithet: 'Maître des Cartes'
    }
  },
  deck: [],
  phase: 'setup' as Phase,
  turn: 1,
  selectedCards: [],
  columns: {
    hearts: { cards: [], isLocked: false, hasLuckyCard: false, activatorType: null, sequence: [], reserveSuit: null },
    diamonds: { cards: [], isLocked: false, hasLuckyCard: false, activatorType: null, sequence: [], reserveSuit: null },
    clubs: { cards: [], isLocked: false, hasLuckyCard: false, activatorType: null, sequence: [], reserveSuit: null },
    spades: { cards: [], isLocked: false, hasLuckyCard: false, activatorType: null, sequence: [], reserveSuit: null }
  },
  hasDiscarded: false,
  hasDrawn: false,
  hasPlayedAction: false,
  playedCardsLastTurn: 0,
  attackMode: false,
  message: '',
  isGameOver: false,
  winner: null as string | null,
  canEndTurn: true,
  language: i18n.language || 'fr',
  queenChallenge: {
    isActive: false,
    queen: null
  },
  isMessageClickable: false,
  exchangeMode: false,
  selectedForExchange: null,
  nextPhase: null,

  initializeGame: () => {
    // Création et mélange du deck complet
    const fullDeck = shuffleDeck(createDeck());
    
    // Distribution aléatoire de 7 cartes
    const [remainingDeck, initialHand] = drawCards(fullDeck, 7);

    set({
      currentPlayer: {
        id: 'player-1',
        name: 'Joueur 1',
        health: 10,
        maxHealth: 10,
        hand: initialHand,
        reserve: [],
        discardPile: [],
        deck: remainingDeck,
        hasUsedStrategicShuffle: false,
        profile: {
          epithet: 'Maître des Cartes'
        }
      },
      deck: remainingDeck,
      phase: 'setup',
      turn: 1,
      selectedCards: [],
      columns: {
        hearts: { cards: [], isLocked: false, hasLuckyCard: false, activatorType: null, sequence: [], reserveSuit: null },
        diamonds: { cards: [], isLocked: false, hasLuckyCard: false, activatorType: null, sequence: [], reserveSuit: null },
        clubs: { cards: [], isLocked: false, hasLuckyCard: false, activatorType: null, sequence: [], reserveSuit: null },
        spades: { cards: [], isLocked: false, hasLuckyCard: false, activatorType: null, sequence: [], reserveSuit: null }
      },
      hasDiscarded: false,
      hasDrawn: false,
      hasPlayedAction: false,
      hasUsedFirstStrategicShuffle: false,
      awaitingStrategicShuffleConfirmation: false,
      isGameOver: false,
      winner: null,
      message: t('game.ui.startMessage')
    });
  },

  selectCard: (card: Card) => {
    set((state) => {
      // Si une action a déjà été jouée, on ne peut plus sélectionner de cartes
      if (state.hasPlayedAction) return state;

      const isCardSelected = state.selectedCards.some(c => c.id === card.id);
      
      // Si la carte est déjà sélectionnée, on la désélectionne
      if (isCardSelected) {
        return {
          ...state,
          selectedCards: state.selectedCards.filter(c => c.id !== card.id),
          message: ''
        };
      }

      // Si on a déjà 2 cartes sélectionnées, on ne peut pas en sélectionner plus
      if (state.selectedCards.length >= 2) {
        return state;
      }

      // Sélection de la carte
      const newSelectedCards = [...state.selectedCards, card];
      let message = '';

      // Messages selon la combinaison
      if (newSelectedCards.length === 1) {
        if (card.value === 'A') {
          message = 'Sélectionnez un Joker ou un 7 pour activer la colonne';
        } else if (card.type === 'joker' || card.value === '7') {
          message = 'Sélectionnez un As pour activer une colonne';
        }
      } else if (newSelectedCards.length === 2) {
        const [card1, card2] = newSelectedCards;
        const hasAs = card1.value === 'A' || card2.value === 'A';
        const hasActivator = (card1.type === 'joker' || card1.value === '7') || 
                            (card2.type === 'joker' || card2.value === '7');
        
        if (hasAs && hasActivator) {
          message = 'Cliquez sur une colonne pour l\'activer';
        }
      }

      return {
        ...state,
        selectedCards: newSelectedCards,
        message
      };
    });
  },

  handleJokerAction: (jokerCard: Card, action: 'heal' | 'attack') => {
    set((state) => {
      if (jokerCard.type !== 'joker' || state.hasPlayedAction || state.phase !== 'action') {
        return state;
      }

      const queen = state.selectedCards.find(card => card.value === 'Q');
      const joker = state.selectedCards.find(card => card.type === 'joker');

      // Si c'est une action avec la Dame
      if (queen && joker) {
        if (action === 'heal') {
          // Action normale de guérison avec la Dame (+2/+4 PV)
          const healAmount = 4; // Avec le Joker, c'est toujours +4 PV
          const newMaxHealth = state.currentPlayer.maxHealth + healAmount;

          // Retirer les cartes de la main ou de la réserve
          const newHand = state.currentPlayer.hand.filter(
            card => !state.selectedCards.some(selected => selected.id === card.id)
          );
          const newReserve = state.currentPlayer.reserve.filter(
            card => !state.selectedCards.some(selected => selected.id === card.id)
          );

          return {
            ...state,
            currentPlayer: {
              ...state.currentPlayer,
              hand: newHand,
              reserve: newReserve,
              health: newMaxHealth,
              maxHealth: newMaxHealth,
              discardPile: [...state.currentPlayer.discardPile, queen, joker]
            },
            selectedCards: [],
            hasPlayedAction: true,
            playedCardsLastTurn: 2,
            message: t('game.messages.queenHeal', { amount: healAmount }),
            canEndTurn: true,
            phase: 'action'
          };
        } else if (action === 'attack') {
          // Activer le défi de la Dame
          return {
            ...state,
            queenChallenge: {
              isActive: true,
              queen: queen
            },
            message: t('game.messages.queenChallenge'),
            isMessageClickable: true
          };
        }
      }

      // Action normale du Joker seul
      let updatedPlayer = { ...state.currentPlayer };

      if (action === 'heal') {
        // Augmente les PV max et actuels de 2
        const healAmount = 2;
        const newHealth = updatedPlayer.health + healAmount;
        updatedPlayer.maxHealth = newHealth;
        updatedPlayer.health = newHealth;
        
        // Déplace le Joker vers la défausse
        updatedPlayer.hand = updatedPlayer.hand.filter(c => c.id !== jokerCard.id);
        updatedPlayer.reserve = updatedPlayer.reserve.filter(c => c.id !== jokerCard.id);
        updatedPlayer.discardPile = [...updatedPlayer.discardPile, jokerCard];

        return {
          ...state,
          currentPlayer: updatedPlayer,
          hasPlayedAction: true,
          selectedCards: [],
          playedCardsLastTurn: 1,
          message: t('game.messages.jokerHeal', { amount: healAmount, health: newHealth }),
          canEndTurn: true,
          phase: 'action'
        };
      } 
      else if (action === 'attack') {
        // Simule une attaque en mode solo
        updatedPlayer.hand = updatedPlayer.hand.filter(c => c.id !== jokerCard.id);
        updatedPlayer.reserve = updatedPlayer.reserve.filter(c => c.id !== jokerCard.id);
        updatedPlayer.discardPile = [...updatedPlayer.discardPile, jokerCard];

        return {
          ...state,
          currentPlayer: updatedPlayer,
          hasPlayedAction: true,
          selectedCards: [],
          playedCardsLastTurn: 1,
          message: t('game.messages.jokerAttack'),
          canEndTurn: true,
          phase: 'action'
        };
      }

      return state;
    });
  },

  handleDrawCard: () => {
    set((state) => {
      if (state.phase !== 'draw' || state.hasDrawn) return state;

      // Calculer combien de cartes manquent pour compléter la main et la réserve
      const currentHandCount = state.currentPlayer.hand.length;
      const currentReserveCount = state.currentPlayer.reserve.length;
      const maxHandCards = 5;
      const maxReserveCards = 2;

      // Calculer combien de cartes on peut ajouter
      const handSpace = Math.max(0, maxHandCards - currentHandCount);
      const reserveSpace = Math.max(0, maxReserveCards - currentReserveCount);
      const cardsNeeded = handSpace + reserveSpace;

      // Si on a déjà le maximum de cartes
      if (cardsNeeded <= 0) {
        return {
          ...state,
          phase: 'action',
          hasDrawn: true,
          message: t('game.messages.actionPhase')
        };
      }

      // Piocher les cartes nécessaires
      const [newDeck, drawnCards] = drawCards(state.deck, cardsNeeded);

      // Distribuer les cartes en priorité à la main
      const newHand = [...state.currentPlayer.hand];
      const newReserve = [...state.currentPlayer.reserve];

      drawnCards.forEach(card => {
        if (newHand.length < maxHandCards) {
          newHand.push(card);
        } else if (newReserve.length < maxReserveCards) {
          newReserve.push(card);
        }
      });

      return {
        ...state,
        deck: newDeck,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve
        },
        phase: 'action',
        hasDrawn: true,
        message: t('game.messages.actionPhase')
      };
    });
  },

  handlePassTurn: () => {
    set((state) => {
      // On ne peut passer le tour que si on est en phase d'action et qu'on a soit joué une action soit passé
      if (state.phase !== 'action' || !state.hasPlayedAction) {
        return state;
      }

      // Calculer le nombre total de cartes en main et en réserve
      const totalCards = state.currentPlayer.hand.length + state.currentPlayer.reserve.length;

      // Déterminer la phase suivante en fonction du nombre total de cartes
      const nextPhase = totalCards === 7 ? 'discard' : 'draw';

      return {
        ...state,
        phase: nextPhase,
        hasDiscarded: false,
        hasDrawn: false,
        hasPlayedAction: false,
        currentPlayer: {
          ...state.currentPlayer,
          hasUsedStrategicShuffle: false
        },
        selectedCards: [],
        turn: state.turn + 1,
        message: nextPhase === 'discard' 
          ? t('game.messages.discardPhase')
          : t('game.messages.drawPhase')
      };
    });
  },
  // Méthodes de gestion des cartes :

  handleSkipAction: () => {
    set((state) => {
      if (state.phase !== 'action' || state.hasPlayedAction) {
        return state;
      }

      return {
        ...state,
        hasPlayedAction: true,
        hasDiscarded: true,
        hasDrawn: true,
        canEndTurn: true,
        playedCardsLastTurn: 0,
        message: t('game.messages.actionSkipped')
      };
    });
  },

  handleSurrender: () => {
    set((state) => ({
      ...state,
      isGameOver: true,
      winner: 'opponent',
      message: t('game.messages.surrendered')
    }));
  },

  handleNewGame: () => {
    const store = get();
    store.initializeGame();
  },

  moveToReserve: (card: Card) => {
    // Gère le déplacement d'une carte vers la réserve
    set((state) => {
      const updatedReserve = [...state.currentPlayer.reserve, card];
      return {
        currentPlayer: {
          ...state.currentPlayer,
          reserve: updatedReserve,
          hand: state.currentPlayer.hand.filter(c => c.id !== card.id)
        }
      };
    });
  },

  moveToHand: (card) => {
    // Gère le déplacement d'une carte vers la main
    set((state) => {
      if (state.currentPlayer.hand.length >= 5) return state;

      return {
        currentPlayer: {
          ...state.currentPlayer,
          reserve: state.currentPlayer.reserve.filter(c => c.id !== card.id),
          hand: [...state.currentPlayer.hand, card]
        }
      };
    });
  },

  startGame: () => {
    set((state) => {
      if (state.currentPlayer.reserve.length !== 2) return state;
      return {
        ...state,
        phase: 'discard',
        hasDiscarded: false,
        hasDrawn: false,
        hasPlayedAction: false,
        hasUsedFirstStrategicShuffle: false,
        message: t('game.messages.strategicShuffleFirst')
      };
    });
  },

  handleDiscard: (card: Card) => {
    set((state) => {
      // On vérifie d'abord si on a plus de 6 cartes
      const totalCards = state.currentPlayer.hand.length + state.currentPlayer.reserve.length;
      if (totalCards <= 6) {
        // Si on a 6 cartes ou moins, on passe directement à la phase de pioche
        return {
          ...state,
          phase: 'draw',
          hasDiscarded: false,
          message: t('game.messages.drawPhase')
        };
      }

      // Sinon, on procède à la défausse normalement
      if (state.phase !== 'discard' || state.hasDiscarded) {
        return state;
      }

      const isFromHand = state.currentPlayer.hand.some(c => c.id === card.id);
      const isFromReserve = state.currentPlayer.reserve.some(c => c.id === card.id);
      
      const newHand = isFromHand 
        ? state.currentPlayer.hand.filter(c => c.id !== card.id)
        : [...state.currentPlayer.hand];
        
      const newReserve = isFromReserve
        ? state.currentPlayer.reserve.filter(c => c.id !== card.id)
        : [...state.currentPlayer.reserve];
      
      const newDiscardPile = [...state.currentPlayer.discardPile, card];

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve,
          discardPile: newDiscardPile
        },
        hasDiscarded: true,
        selectedCards: [],
        phase: 'draw',
        message: t('game.messages.drawPhase')
      };
    });
  },

  recycleDiscardPile: () => {
    // Récupère les cartes de la défausse pour remplir le deck
    set((state) => {
      if (state.deck.length > 0 || state.currentPlayer.discardPile.length === 0) return state;

      const newDeck = shuffleDeck([...state.currentPlayer.discardPile]);
      
      return {
        deck: newDeck,
        currentPlayer: {
          ...state.currentPlayer,
          discardPile: []
        }
      };
    });
  },

  exchangeCards: (card1: Card, card2: Card) => {
    set((state) => {
      const hand = [...state.currentPlayer.hand];
      const reserve = [...state.currentPlayer.reserve];

      // Trouver les indices des cartes
      const handIndex = hand.findIndex(c => c.id === card1.id);
      const reserveIndex = reserve.findIndex(c => c.id === card2.id);

      // Si l'une des cartes n'est pas trouvée, annuler l'échange
      if (handIndex === -1 || reserveIndex === -1) {
        return state;
      }


      
      // Échanger les cartes
      const tempCard = hand[handIndex];
      hand[handIndex] = reserve[reserveIndex];
      reserve[reserveIndex] = tempCard;

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: hand,
          reserve: reserve
        },
        message: t('game.messages.exchangeComplete')
      };
    });
  },
  // Méthodes utilitaires :

  updateProfile: (profile) => {
    // Met à jour le profil du joueur
    set((state) => ({
      currentPlayer: {
        ...state.currentPlayer,
        name: profile.name,
        profile: {
          ...state.currentPlayer.profile,
          epithet: profile.epithet,
          avatar: profile.avatar
        }
      }
    }));
  },

  updatePhaseAndMessage: (phase: Phase) => {
    set((state) => {
      const messages = {
        setup: '🎮 Phase de préparation : Choisissez vos 2 cartes de réserve',
        discard: state.turn === 1 
          ? ' Pour commencer la partie, veuillez défausser votre première carte'
          : '♻️ Phase de défausse : Vous devez défausser une carte',
        draw: '🎴 Phase de pioche : Piochez pour complter votre main',
        action: '⚔️ Phase d\'action : Jouez vos cartes ou passez votre tour'
      };

      return {
        phase,
        message: messages[phase] || state.message
      };
    });
  },

  debugGiveJokers: () => {
    // Fonction de debug pour ajouter des jokers à la main
    set((state) => {
      // Utilise les cartes de test prédéfinies
      const testHand = [
        // Jokers
        {
          id: 'joker-red',
          type: 'joker',
          value: 'JOKER',
          suit: 'special',
          color: 'red',
          isRedJoker: true
        },
        {
          id: 'joker-black',
          type: 'joker',
          value: 'JOKER',
          suit: 'special',
          color: 'black',
          isRedJoker: false
        },
        // As
        {
          id: 'ace-hearts',
          type: 'number',
          value: 'A',
          suit: 'hearts',
          color: 'red'
        },
        {
          id: 'ace-spades',
          type: 'number',
          value: 'A',
          suit: 'spades',
          color: 'black'
        },
        // Sept
        {
          id: 'seven-hearts',
          type: 'number',
          value: '7',
          suit: 'hearts',
          color: 'red'
        }
      ];

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: testHand
        }
      };
    });
  },

  // Fonction utilitaire pour vérifier si une carte peut être sélectionnée
  canSelectCard: (card: Card) => {
    // Une carte peut être sélectionnée si elle est dans la main OU dans la rserve
    const state = get();
    return state.currentPlayer.hand.some(c => c.id === card.id) ||
           state.currentPlayer.reserve.some(c => c.id === card.id);
  },

  // Fonction utilitaire pour vérifier si un Joker peut être joué
  canPlayJoker: (jokerCard: Card) => {
    const state = get();
    return (
      jokerCard.type === 'joker' && 
      state.phase === 'action' &&
      !state.hasPlayedAction && // Vérifie qu'aucune action n'a été jouée ce tour
      (state.currentPlayer.hand.some(c => c.id === jokerCard.id) ||
       state.currentPlayer.reserve.some(c => c.id === jokerCard.id))
    );
  },

  // Ajout d'une nouvelle fonction pour vérifier si des actions sont encore possibles
  canPerformActions: () => {
    const state = get();
    // Si un Joker a été joué, aucune autre action n'est possible
    if (state.phase === 'endTurn') {
      return false;
    }
    return true;
  },

  // Fonction utilitaire pour vérifier si des cartes peuvent être jouées
  canPlayCards: () => {
    const state = get();
    return (
      state.phase === 'action' &&
      !state.hasPlayedAction // Vérifie qu'aucune action n'a été jouée ce tour
    );
  },

  setAttackMode: (value: boolean) => set({ attackMode: value }),
  setMessage: (message: string) => set({ message: message }),

  endTurn: () => {
    set((state) => {
      const totalCards = state.currentPlayer.hand.length + state.currentPlayer.reserve.length;
      
      // Utiliser nextPhase s'il est défini, sinon calculer en fonction du nombre de cartes
      const nextPhase = state.nextPhase || (totalCards === 7 ? 'discard' : 'draw');

      return {
        ...state,
        phase: nextPhase,
        hasDiscarded: false,
        hasDrawn: false,
        hasPlayedAction: false,
        selectedCards: [],
        nextPhase: null, // Réinitialiser nextPhase
        message: nextPhase === 'discard' 
          ? t('game.messages.discardPhase')
          : t('game.messages.drawPhase'),
        playedCardsLastTurn: state.selectedCards.length
      };
    });
  },

  handleDiscard: (card: Card) => {
    set((state) => {
      if (state.phase !== 'discard' || state.hasDiscarded) {
        return state;
      }

      const isFromHand = state.currentPlayer.hand.some(c => c.id === card.id);
      const isFromReserve = state.currentPlayer.reserve.some(c => c.id === card.id);
      
      const newHand = isFromHand 
        ? state.currentPlayer.hand.filter(c => c.id !== card.id)
        : [...state.currentPlayer.hand];
        
      const newReserve = isFromReserve
        ? state.currentPlayer.reserve.filter(c => c.id !== card.id)
        : [...state.currentPlayer.reserve];
      
      const newDiscardPile = [...state.currentPlayer.discardPile, card];

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve,
          discardPile: newDiscardPile
        },
        hasDiscarded: true,
        selectedCards: [],
        phase: 'draw',
        message: t('game.messages.drawPhase')
      };
    });
  },

  canUseStrategicShuffle: () => {
    const state = get();
    return (
      state.phase === 'discard' &&  // Uniquement en phase de défausse (début du tour)
      !state.hasDiscarded &&        // Pas encore défaussé
      !state.hasDrawn &&            // Pas encore pioché
      !state.hasPlayedAction &&     // Pas encore joué d'action
      !state.currentPlayer.hasUsedStrategicShuffle  // N'a pas encore utilisé le mélange ce tour-ci
    );
  },

  handleStrategicShuffle: () => {
    set((state) => {
      if (!state.canUseStrategicShuffle()) {
        return state;
      }

      const allDiscardedCards = [
        ...state.currentPlayer.hand,
        ...state.currentPlayer.discardPile
      ];
      const allCards = [...state.deck, ...allDiscardedCards];
      const newDeck = shuffleDeck(allCards);
      const [remainingDeck, newHand] = drawCards(newDeck, 5);

      if (!state.hasUsedFirstStrategicShuffle) {
        return {
          ...state,
          deck: remainingDeck,
          currentPlayer: {
            ...state.currentPlayer,
            hand: newHand,
            discardPile: [],
            hasUsedStrategicShuffle: true
          },
          hasUsedFirstStrategicShuffle: true,
          phase: 'action',
          hasDiscarded: true,
          hasDrawn: true,
          hasPlayedAction: false,
          message: t('game.messages.strategicShuffleFirst'),
          isMessageClickable: true
        };
      }

      // Si ce n'est pas le premier mélange stratégique
      return {
        ...state,
        deck: remainingDeck,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          discardPile: [],
          hasUsedStrategicShuffle: true
        },
        phase: 'action',
        hasDiscarded: true,
        hasDrawn: true,
        hasPlayedAction: true,
        canEndTurn: true,
        message: t('game.messages.strategicShuffleNext'),
        isMessageClickable: true
      };
    });
  },

  confirmStrategicShuffle: () => {
    set((state) => ({
      ...state,
      deck: shuffleDeck([...state.deck, ...state.currentPlayer.discardPile, ...state.currentPlayer.hand]),
      currentPlayer: {
        ...state.currentPlayer,
        hand: [],
        reserve: state.currentPlayer.reserve,
        discardPile: []
      },
      phase: 'discard',
      hasDiscarded: true,
      hasPlayedAction: true,
      awaitingStrategicShuffleConfirmation: false,
      message: t('game.messages.strategicShuffleNext')
    }));
  },

  setLanguage: (lang: string) => {
    set({ language: lang });
  },

  handleStrategicShuffleAction: () => {
    set((state) => {
      if (state.currentPlayer.hasUsedStrategicShuffle) {
        return state;
      }

      const allCards = [...state.deck, ...state.currentPlayer.discardPile];
      const newDeck = shuffleDeck(allCards);
      const [remainingDeck, newHand] = drawCards(newDeck, 5);

      return {
        ...state,
        deck: remainingDeck,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          discardPile: [],
          hasUsedStrategicShuffle: true
        },
        hasPlayedAction: true,
        message: t('game.messages.strategicShuffleFirst')
      };
    });
  },

  canEndTurn: () => {
    const state = get();
    return (
      state.phase === 'action' && // Doit être en phase d'action
      state.hasPlayedAction      // Doit avoir joué ou passé une action
    );
  },

  handleCardPlace: (suit: Suit, position: number) => {
    set((state) => {
      const column = state.columns[suit];
      
      // Cas d'activation avec As + Activateur
      if (state.selectedCards.length === 2) {
        const hasAs = state.selectedCards.some(card => card.value === 'A');
        const hasActivator = state.selectedCards.some(card => 
          card.type === 'joker' || card.value === '7'
        );
        
        if (hasAs && hasActivator && position === 0) {
          const ace = state.selectedCards.find(card => card.value === 'A');
          const activator = state.selectedCards.find(card => 
            card.type === 'joker' || card.value === '7'
          );
          
          if (ace?.suit === suit && (column.cards.length === 0 || !column.hasLuckyCard)) {
            // Retirer les cartes de la main ou de la réserve
            const newHand = state.currentPlayer.hand.filter(
              card => !state.selectedCards.some(selected => selected.id === card.id)
            );
            const newReserve = state.currentPlayer.reserve.filter(
              card => !state.selectedCards.some(selected => selected.id === card.id)
            );

            return {
              ...state,
              columns: {
                ...state.columns,
                [suit]: {
                  ...column,
                  hasLuckyCard: true,
                  cards: [ace],
                  reserveSuit: activator?.type === 'joker' || activator?.value === '7' 
                    ? activator 
                    : null,
                  activatorType: activator?.type === 'joker' ? 'JOKER' : '7'
                }
              },
              currentPlayer: {
                ...state.currentPlayer,
                hand: newHand,
                reserve: newReserve
              },
              selectedCards: [],
              hasPlayedAction: true,
              playedCardsLastTurn: 2,
              message: t('game.messages.columnActivated')
            };
          }
        }
      }

      // Cas d'activation avec Tête + Activateur (même structure que l'As)
      if (state.selectedCards.length === 2) {
        const hasFaceCard = state.selectedCards.some(card => card.value === 'J' || card.value === 'K');
        const hasActivator = state.selectedCards.some(card => 
          card.type === 'joker' || card.value === '7'
        );
        
        if (hasFaceCard && hasActivator && position === 0) {
          const faceCard = state.selectedCards.find(card => card.value === 'J' || card.value === 'K');
          const activator = state.selectedCards.find(card => 
            card.type === 'joker' || card.value === '7'
          );
          
          if (faceCard?.suit === suit) {
            // Retirer les cartes de la main/réserve (exactement comme pour l'As)
            const newHand = state.currentPlayer.hand.filter(
              card => !state.selectedCards.some(selected => selected.id === card.id)
            );
            const newReserve = state.currentPlayer.reserve.filter(
              card => !state.selectedCards.some(selected => selected.id === card.id)
            );

            return {
              ...state,
              columns: {
                ...state.columns,
                [suit]: {
                  ...column,
                  faceCards: {
                    ...column.faceCards,
                    [faceCard.value]: faceCard
                  }
                }
              },
              currentPlayer: {
                ...state.currentPlayer,
                hand: newHand,
                reserve: newReserve,
                discardPile: [...state.currentPlayer.discardPile, activator]
              },
              selectedCards: [],
              hasPlayedAction: true,
              playedCardsLastTurn: 2,
              message: t('game.messages.faceCardPlaced', {
                value: faceCard.value === 'J' ? 'Valet' : 'Roi'
              })
            };
          }
        }
      }

      // Placement normal d'une carte
      if (state.selectedCards.length === 1) {
        const card = state.selectedCards[0];
        
        // Si c'est un 7 qui est placé à la position 7 dans sa propre couleur
        if (card.value === '7' && card.suit === suit && position === 7) {
          // Vérifier si il y a une carte dans reserveSuit
          const existingActivator = column.reserveSuit;
          
          // Vérifier d'où vient le 7 (main ou réserve)
          const isFromHand = state.currentPlayer.hand.some((c: Card) => c.id === card.id);
          
          // Retirer le 7 de son emplacement d'origine
          const newHand = isFromHand 
            ? state.currentPlayer.hand.filter(c => c.id !== card.id)
            : state.currentPlayer.hand;
          const newReserve = !isFromHand 
            ? state.currentPlayer.reserve.filter(c => c.id !== card.id)
            : state.currentPlayer.reserve;

          // Si il y a une carte dans reserveSuit, on la récupère dans la main ou la réserve
          if (existingActivator) {
            if (isFromHand) {
              newHand.push(existingActivator);
            } else {
              newReserve.push(existingActivator);
            }
          }

          return {
            ...state,
            columns: {
              ...state.columns,
              [suit]: {
                ...column,
                cards: [
                  ...column.cards.slice(0, position),
                  card,
                  ...column.cards.slice(position + 1)
                ],
                reserveSuit: null,  // On enlève l'activateur
                activatorType: null
              }
            },
            currentPlayer: {
              ...state.currentPlayer,
              hand: newHand,
              reserve: newReserve
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
        }

        // Si pas d'activateur, placement normal du 7
        return {
          ...state,
          columns: {
            ...state.columns,
            [suit]: {
              ...column,
              cards: [
                ...column.cards.slice(0, position),
                card,
                ...column.cards.slice(position + 1)
              ]
            }
          },
          currentPlayer: {
            ...state.currentPlayer,
            hand: newHand,
            reserve: newReserve
          },
          selectedCards: [],
          hasPlayedAction: true,
          playedCardsLastTurn: 1,
          message: t('game.messages.sevenPlaced')
        };
      }

      // Cas d'activation avec Dame + Activateur
      if (state.selectedCards.length === 2) {
        const hasQueen = state.selectedCards.some(card => card.value === 'Q');
        const hasActivator = state.selectedCards.some(card => 
          card.type === 'joker' || card.value === '7'
        );
        
        if (hasQueen && hasActivator) {
          const queen = state.selectedCards.find(card => card.value === 'Q');
          const activator = state.selectedCards.find(card => 
            card.type === 'joker' || card.value === '7'
          );
          
          // Retirer les cartes de la main/réserve
          const newHand = state.currentPlayer.hand.filter(
            card => !state.selectedCards.some(selected => selected.id === card.id)
          );
          const newReserve = state.currentPlayer.reserve.filter(
            card => !state.selectedCards.some(selected => selected.id === card.id)
          );

          const updatedColumns = { ...state.columns };
          const targetColumn = Object.values(updatedColumns).find(col => 
            col.reserveSuit?.id === activator?.id
          );

          if (targetColumn) {
            targetColumn.reserveSuit = null;
          }

          // Calculer le nombre total de cartes après l'échange
          const totalCards = newHand.length + newReserve.length;
          // Déterminer la prochaine phase en fonction du nombre de cartes
          const nextPhase = totalCards === 7 ? 'discard' : 'draw';

          return {
            ...state,
            currentPlayer: {
              ...state.currentPlayer,
              hand: newHand,
              reserve: newReserve,
              discardPile: [...state.currentPlayer.discardPile, queen, activator]
            },
            columns: updatedColumns,
            selectedCards: [],
            hasPlayedAction: true,
            playedCardsLastTurn: 2,
            message: t('game.messages.queenHealing', {
              amount: 4
            }),
            canEndTurn: true,
            phase: 'action',
            nextPhase: nextPhase
          };
        }
      }

      return state;
    });
  },

  handleQueenChallenge: (isCorrect: boolean) => {
    set((state) => {
      const queen = state.selectedCards.find(card => card.value === 'Q');
      const joker = state.selectedCards.find(card => card.type === 'joker');

      if (!queen || !joker) return state;

      const healAmount = isCorrect ? 5 : 1;
      const newMaxHealth = state.currentPlayer.maxHealth + healAmount;

      // Retirer les cartes de la main ou de la réserve
      const newHand = state.currentPlayer.hand.filter(
        card => !state.selectedCards.some(selected => selected.id === card.id)
      );
      const newReserve = state.currentPlayer.reserve.filter(
        card => !state.selectedCards.some(selected => selected.id === card.id)
      );

      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          hand: newHand,
          reserve: newReserve,
          health: newMaxHealth,
          maxHealth: newMaxHealth,
          discardPile: [...state.currentPlayer.discardPile, queen, joker]
        },
        selectedCards: [],
        queenChallenge: {
          isActive: false,
          queen: null
        },
        hasPlayedAction: true,
        playedCardsLastTurn: 2, // Pour passer directement à la pioche au tour suivant
        message: t('game.messages.queenChallengeResult', {
          amount: healAmount,
          result: isCorrect ? 'correct' : 'incorrect'
        }),
        canEndTurn: true
      };
    });
  },

  clearMessage: () => set(state => ({ ...state, message: '', isMessageClickable: false })),

  handleActivatorExchange: (suit:string, columnCard: Card, playerCard: Card) => {
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
      const isInHand = state.currentPlayer.hand.some((c: Card) => c.id === playerCard.id);
      
      // Placer la carte de la colonne  dans la main ou la réserve selon l'origine
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
  },

  getPhaseMessage: (phase: Phase, hasDiscarded: boolean, hasDrawn: boolean, hasPlayedAction: boolean, playedCardsLastTurn: number): string => {
    switch (phase) {
      case 'discard':
        if (playedCardsLastTurn > 0) {
          return '';
        }
        return hasDiscarded ? '' : t('phase.discard');
        
      case 'draw':
        return hasDrawn ? '' : t('phase.draw');
        
      case 'action':
        if (hasPlayedAction) {
          return '';
        }
        return t('phase.action');
        
      default:
        return '';
    }
  },

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
  },

  handleRevolution: () => {
    set((state) => {
      // Utiliser les mêmes valeurs que dans le deck
      const cartesADefausser = VALUES.filter(value => 
        value === 'A' || // As
        (value >= '2' && value <= '10') // 2 à 10
      );
      
      let cartesDefaussees: Card[] = [];

      // Créer de nouvelles colonnes en défaussant toutes les cartes de As à 10
      const newColumns = Object.entries(state.columns).reduce((cols, [suit, column]) => {
        // 1. Défausser les cartes de la colonne
        const cartesFiltrees = column.cards.filter(card => {
          if (cartesADefausser.includes(card.value)) {
            cartesDefaussees.push(card);
            return false;
          }
          return true;
        });

        // 2. Vérifier la reserveSuit
        if (column.reserveSuit && cartesADefausser.includes(column.reserveSuit.value)) {
          cartesDefaussees.push(column.reserveSuit);
        }

        // 3. Créer la nouvelle colonne avec tous les états réinitialisés
        const newColumn = {
          cards: cartesFiltrees,
          reserveSuit: column.reserveSuit && cartesADefausser.includes(column.reserveSuit.value) ? null : column.reserveSuit,
          hasLuckyCard: false,  // Toujours désactiver le statut doré
          activatorType: null,  // Réinitialiser l'activateur
          isLocked: false,      // Déverrouiller la colonne
          isReserveBlocked: false,  // Débloquer la réserve
          sequence: []          // Réinitialiser la séquence
        };

        return {
          ...cols,
          [suit]: newColumn
        };
      }, {} as Record<Suit, ColumnState>);

      // Mettre toutes les cartes dans la défausse
      const updatedDiscardPile = [...state.currentPlayer.discardPile, ...cartesDefaussees];

      // Calculer le nombre total de cartes en main et en réserve
      const totalCards = state.currentPlayer.hand.length + state.currentPlayer.reserve.length;

      // Déterminer la prochaine phase en fonction du nombre de cartes
      const nextPhase = totalCards >= 7 ? 'discard' : 'draw';

      return {
        ...state,
        columns: newColumns,
        currentPlayer: {
          ...state.currentPlayer,
          discardPile: updatedDiscardPile
        },
        phase: nextPhase,
        message: t('game.messages.revolution'),
        hasPlayedAction: true
      };
    });
  }
}));
