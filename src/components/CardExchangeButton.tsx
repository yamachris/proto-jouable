import React, { useState } from 'react';
import { Card, ColumnState } from '../types/game';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, ArrowDown, ArrowsUpDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { useGameStore } from '../store/gameStore';

interface CardExchangeButtonProps {
  suit: string;
  activatorCard: Card;
  column: ColumnState;
}

export const CardExchangeButton: React.FC<CardExchangeButtonProps> = ({ suit, activatorCard, column }) => {
  const { t } = useTranslation();
  const { 
    currentPlayer, 
    phase, 
    hasPlayedAction, 
    selectedCards,
    handleActivatorExchange,
    handleSevenAction 
  } = useGameStore();

  // === ÉCHANGE : Logique d'échange ===
  const hasValidExchangeCard = selectedCards.length === 1 && 
    (selectedCards[0].value === '7' || selectedCards[0].type === 'joker');

  // Vérifier si on peut échanger (phase action, pas d'action jouée, carte valide)
  const canExchange = phase === 'action' && 
    !hasPlayedAction && 
    hasValidExchangeCard &&
    column.reserveSuit; // Il doit y avoir une carte en reserveSuit

  // Bouton d'échange (uniquement si l'échange est possible)
  if (canExchange) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          const selectedCard = selectedCards[0];
          
          // Vérifier que les deux cartes sont des 7 ou JOKER
          if ((selectedCard.value === '7' || selectedCard.type === 'joker') && 
              (column.reserveSuit.value === '7' || column.reserveSuit.type === 'joker')) {
                console.log('=== DÉBUT HANDLE ACTIVATOR EXCHANGE ===');
                console.log('État initial:', {
                  selectedCard,
                  reserveSuit: column.reserveSuit
                });
            handleActivatorExchange(suit, column.reserveSuit, selectedCard);
          }
        }}
        className="flex items-center gap-1 px-2 py-1 text-sm rounded dark:bg-slate-800 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-white text-slate-900"
      >
        <ArrowLeftRight className="w-4 h-4" />
        {t('Échanger')}
      </button>
    );
  }

  // === PLACEMENT : Logique de placement ===
  // Vérifie si le 7 est déjà dans la reserveSuit
  const hasCorrectSevenInReserveSuit = column.reserveSuit?.value === '7' && column.reserveSuit?.suit === column.cards[5]?.suit;
  
  const hasCorrectSevenInHandOrReserve = (
    currentPlayer.hand.some(card => card.value === '7' && card.suit === column.cards[5]?.suit) ||
    currentPlayer.reserve.some(card => card.value === '7' && card.suit === column.cards[5]?.suit)
  );

  // Vérifie si un 7 est présent dans la colonne (pour bloquer la reserveSuit)
  const hasSevenInColumn = column.cards.some(card => card.value === '7');

  const reserveSuitCard = column.reserveSuit;
  const canPlaceCard = column.cards[5]?.value === '6' && 
    !hasSevenInColumn && // Bloque si un 7 est présent dans la colonne
    phase === 'action' && 
    !hasPlayedAction &&
    (hasCorrectSevenInHandOrReserve || hasCorrectSevenInReserveSuit); // Permet le placement si le 7 est dans la reserveSuit

  // Vérifier les limites de main et réserve
  const handSize = currentPlayer.hand.length;
  const reserveSize = currentPlayer.reserve.length;
  const maxHandSize = 5;
  const maxReserveSize = 2;

  // Priorité au placement automatique si les conditions sont réunies
  if (canPlaceCard && column.cards[5]) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Trouver le 7 de la même couleur dans la main, réserve ou reserveSuit
          const correctSevenFromHand = currentPlayer.hand.find(card => 
            card.value === '7' && card.suit === column.cards[5].suit
          );
          const correctSevenFromReserve = currentPlayer.reserve.find(card => 
            card.value === '7' && card.suit === column.cards[5].suit
          );
          const correctSevenFromReserveSuit = column.reserveSuit?.value === '7' && 
            column.reserveSuit?.suit === column.cards[5].suit ? column.reserveSuit : null;
          
          const correctSeven = correctSevenFromHand || correctSevenFromReserve || correctSevenFromReserveSuit;

          if (!correctSeven) return;

          // Vérifier les limites avant le placement
          const isFromHand = correctSevenFromHand !== undefined;
          const targetSize = isFromHand ? handSize : reserveSize;
          const maxSize = isFromHand ? maxHandSize : maxReserveSize;

          if (targetSize >= maxSize && column.reserveSuit) {
            useGameStore.setState(state => ({
              ...state,
              message: 'Cette action dépasserait la limite de cartes permise.'
            }));
            return;
          }

          // Récupérer la carte existante dans reserveSuit si elle existe
          const existingReserveSuit = column.reserveSuit;

          // Mettre à jour la colonne avec le 7 et bloquer la réserve
          const newColumn = {
            ...column,
            cards: [...column.cards, correctSeven],
            reserveSuit: null,
            activatorType: null,
            isReserveBlocked: true
          };

          // Mettre à jour la main ou la réserve du joueur
          let newPlayerHand = [...currentPlayer.hand];
          let newPlayerReserve = [...currentPlayer.reserve];

          if (correctSevenFromHand) {
            // Si le 7 vient de la main
            newPlayerHand = newPlayerHand.filter(card => card.id !== correctSeven.id);
            if (existingReserveSuit) {
              if (handSize < maxHandSize) {
                newPlayerHand.push(existingReserveSuit);
              }
            }
          } else if (correctSevenFromReserve) {
            // Si le 7 vient de la réserve
            newPlayerReserve = newPlayerReserve.filter(card => card.id !== correctSeven.id);
            if (existingReserveSuit) {
              if (reserveSize < maxReserveSize) {
                newPlayerReserve.push(existingReserveSuit);
              }
            }
          }

          useGameStore.setState(state => ({
            ...state,
            columns: {
              ...state.columns,
              [column.cards[5].suit]: newColumn
            },
            currentPlayer: {
              ...state.currentPlayer,
              hand: newPlayerHand,
              reserve: newPlayerReserve
            },
            hasPlayedAction: true,
            message: existingReserveSuit 
              ? `Le 7 est placé et la carte ${existingReserveSuit.value} est récupérée`
              : "Le 7 est placé en position d'activateur",
            phase: 'action'
          }));
        }}
        className="flex items-center gap-1 px-2 py-1 text-sm rounded dark:bg-slate-800 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-white text-slate-900"
      >
        <ArrowDown className="w-4 h-4" />
        {t('Placer')}
      </button>
    );
  }

  return null;
};

// Composant de test séparé
export const TestButton: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const gameStore = useGameStore();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const testGameLogic = () => {
    setLogs([]); 
    try {
      // Créer une séquence de test pour le remplacement du 7
      const testCards = [
        { id: '6-diamonds', value: '6', suit: 'diamonds', type: 'number', color: 'red' },
        { id: '7-spades', value: '7', suit: 'spades', type: 'number', color: 'black' },
        { id: '7-diamonds', value: '7', suit: 'diamonds', type: 'number', color: 'red' }
      ];

      if (gameStore.currentPlayer && gameStore.setPhase && gameStore.handleCardPlace) {
        addLog("Début du test de remplacement du 7...");

        // Placer le 6 de carreau
        gameStore.currentPlayer.hand = [testCards[0]];
        addLog("1. Placement du 6 de carreau");
        gameStore.setPhase('action');
        const success1 = gameStore.handleCardPlace('diamonds', 0);
        addLog(success1 ? "✅ 6 de carreau placé" : "❌ Échec du placement du 6");

        // Placer le 7 de pique (activateur)
        gameStore.currentPlayer.hand = [testCards[1]];
        addLog("\n2. Placement du 7 de pique (activateur)");
        gameStore.setPhase('action');
        const success2 = gameStore.handleCardPlace('diamonds', 1);
        addLog(success2 ? "✅ 7 de pique placé" : "❌ Échec du placement du 7 de pique");

        // Tenter de remplacer par le 7 de carreau
        gameStore.currentPlayer.hand = [testCards[2]];
        addLog("\n3. Tentative de remplacement par le 7 de carreau");
        gameStore.setPhase('action');
        const success3 = gameStore.handleCardPlace('diamonds', 1);
        addLog(success3 ? "✅ 7 de carreau placé et 7 de pique retourné" : "❌ Échec du remplacement");

        addLog("\nTest terminé!");
      }

      setTestResult('Test de remplacement du 7 terminé');
    } catch (error) {
      addLog(`\n❌ ERREUR: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setTestResult(`Échec du test : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={testGameLogic}
        className="px-4 py-2 rounded text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
      >
        Tester le remplacement
      </button>
      {(testResult || logs.length > 0) && (
        <div className="mt-2 p-2 rounded border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm text-sm max-h-96 overflow-y-auto" style={{ minWidth: '300px' }}>
          {logs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap mb-1">
              {log}
            </div>
          ))}
          {testResult && (
            <div className="mt-2 pt-2 border-t font-bold">
              {testResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};