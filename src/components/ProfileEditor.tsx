import React, { useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Edit2, X, Check, Camera } from 'lucide-react';
import { cn } from '../utils/cn';
import { validateName, validateEpithet, validateAvatar, sanitizeInput } from '../utils/security';

export function ProfileEditor() {
  const { currentPlayer, updateProfile } = useGameStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentPlayer.name);
  const [epithet, setEpithet] = useState(currentPlayer.profile.epithet || 'Maître des Cartes');
  const [tempAvatar, setTempAvatar] = useState<string | undefined>(
    currentPlayer.profile.avatar
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setError(null);
  };

  const handleEpithetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEpithet(e.target.value);
    setError(null);
  };

  const handleSave = () => {
    const sanitizedName = sanitizeInput(name);
    const sanitizedEpithet = sanitizeInput(epithet);

    if (!validateName(sanitizedName)) {
      setError("Le nom doit contenir entre 1 et 30 caractères valides");
      return;
    }

    if (!validateEpithet(sanitizedEpithet)) {
      setError("Le titre doit contenir entre 1 et 50 caractères valides");
      return;
    }

    if (!validateAvatar(tempAvatar)) {
      setError("L'image n'est pas valide ou dépasse 5MB");
      return;
    }

    try {
      updateProfile({
        name: sanitizedName,
        epithet: sanitizedEpithet,
        avatar: tempAvatar
      });
      
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setError("Erreur lors de la mise à jour du profil");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(currentPlayer.name);
    setEpithet(currentPlayer.profile.epithet);
    setTempAvatar(currentPlayer.profile.avatar);
    setError(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop grande (max 5MB)");
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      if (!validateAvatar(base64)) {
        setError("Format d'image non supporté");
        return;
      }

      setTempAvatar(base64);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement de l'image");
    }
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Avatar section */}
        <div className="relative">
          <div
            onClick={handleAvatarClick}
            className={cn(
              "w-16 h-16 rounded-full overflow-hidden",
              isEditing && "cursor-pointer hover:opacity-80 transition-opacity"
            )}
          >
            {tempAvatar ? (
              <img src={tempAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-2xl text-blue-500 dark:text-blue-300">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Profile info */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Votre nom"
                className="w-full px-2 py-1 bg-transparent border-b-2 border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-500 outline-none"
              />
              <input
                type="text"
                value={epithet}
                onChange={handleEpithetChange}
                placeholder="Votre titre"
                className="w-full px-2 py-1 bg-transparent border-b-2 border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-500 outline-none"
              />
              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{epithet}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Annuler"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                className="p-2 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200 transition-colors"
                title="Sauvegarder"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleEditClick}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Modifier le profil"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}