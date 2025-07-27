'use client';

import { useState } from 'react';
import styles from '../../app/page.module.css';
import { GameTopBar, GameBottomBar, GameMainArea } from './';
import { ProfileModal, QuestModal, PetsModal, ShopModal } from './components/Modals';

export const GameInterface = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [showShop, setShowShop] = useState(false);

  return (
    <div className={styles.gamePlayArea}>
      {/* Top Bar */}
      <GameTopBar 
        onProfileClick={() => setShowProfile(!showProfile)}
        onQuestClick={() => setShowQuests(!showQuests)}
      />

      {/* Main Game Area */}
      <GameMainArea />

      {/* Bottom Bar */}
      <GameBottomBar 
        onPetsClick={() => setShowPets(!showPets)}
        onShopClick={() => setShowShop(!showShop)}
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
    </div>
  );
}; 