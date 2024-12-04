import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Flag, ArrowRight, AlertCircle, SkipForward, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { getPhaseMessage } from '../utils/gameLogic';
import { useTranslation } from 'react-i18next';

export function GameControls() {
  const { 
    phase,
    turn,
    hasDiscarded,
    hasDrawn,
    hasPlayedAction,
    handlePassTurn,
    handleSurrender,
    handleSkipAction,
    currentPlayer,
    handleStrategicShuffleAction,
    language
  } = useGameStore();

  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  // Forcer le rendu quand la langue change
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Language changed in GameControls:', i18n.language);
      forceUpdate({});
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleStrategicShuffle = () => {
    setShowModal(true);
  };

  const handleConfirmStrategicShuffle = () => {
    handleStrategicShuffleAction();
    setShowModal(false);
  };

  const totalCards = currentPlayer.hand.length + currentPlayer.reserve.length;
  const canPassTurn = phase === 'action' && hasDiscarded && hasDrawn;
  const canSkipAction = phase === 'action' && !hasPlayedAction;

  const phaseMessage = getPhaseMessage(phase, hasDiscarded, hasDrawn, hasPlayedAction, totalCards, turn);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg font-medium">
              <span>
                {t('game.turn', { number: turn })} - {t(`game.${phase}`)}
              </span>
            </div>
          </div>

          {phaseMessage && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-4 h-4" />
              <span>{phaseMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
                onClick={() => {
                  if (window.confirm(t('game.actions.surrenderConfirmBox'))) {
                    handleSurrender();
                  }
                }}
              className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-300 flex items-center gap-2"
            >
              <Flag className="w-4 h-4" />
              <span>{t('game.actions.surrender')}</span>
            </button>

            {canSkipAction && (
              <button
                onClick={handleSkipAction}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2",
                  "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
                  "hover:bg-yellow-200 dark:hover:bg-yellow-800"
                )}
              >
                <SkipForward className="w-4 h-4" />
                <span>{t('game.actions.skipAction')}</span>
              </button>
            )}

            <button
              onClick={handlePassTurn}
              disabled={!canPassTurn}
              className={cn(
                "px-6 py-2.5 rounded-lg font-medium flex items-center gap-2",
                canPassTurn 
                  ? "bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed",
                "transition-colors duration-300"
              )}
            >
              <span>{t('game.actions.endTurn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {t('game.ui.strategicShuffle')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('game.messages.strategicShuffleConfirm')}
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('game.ui.cancel')}
              </button>
              <button
                onClick={handleConfirmStrategicShuffle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('game.ui.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}