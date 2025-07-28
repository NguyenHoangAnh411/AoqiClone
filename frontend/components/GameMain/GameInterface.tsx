'use client';

import { useState } from 'react';
import styles from '../../app/page.module.css';
import { GameMainArea } from './';
import { ProfileModal, QuestModal, PetsModal, ShopModal, FormationModal } from './components/Modals';

export const GameInterface = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showFormation, setShowFormation] = useState(false);

  // Handler functions for corner buttons
  const handleCornerProfile = () => setShowProfile(!showProfile);
  const handleCornerQuests = () => setShowQuests(!showQuests);
  const handleCornerPets = () => setShowPets(!showPets);
  const handleCornerShop = () => setShowShop(!showShop);
  const handleCornerFormation = () => setShowFormation(!showFormation);

  return (
    <div className={styles.gamePlayArea}>
      {/* Main Game Area */}
      <GameMainArea 
        onCornerProfile={handleCornerProfile}
        onCornerQuests={handleCornerQuests}
        onCornerPets={handleCornerPets}
        onCornerShop={handleCornerShop}
        onCornerFormation={handleCornerFormation}
      />

      {/* Modals */}
      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
      
      <QuestModal 
        isOpen={showQuests} 
        onClose={() => setShowQuests(false)} 
      />
      
      <PetsModal 
        isOpen={showPets} 
        onClose={() => setShowPets(false)} 
      />
      
      <ShopModal 
        isOpen={showShop} 
        onClose={() => setShowShop(false)} 
      />

      <FormationModal 
        isOpen={showFormation} 
        onClose={() => setShowFormation(false)} 
      />
    </div>
  );
}; 