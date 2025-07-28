import React from 'react';
import styles from '../../app/page.module.css';

interface Pet {
  _id: string;
  name: string;
  img: string;
  rarity: string;
  element: string;
}

interface UserPet {
  _id: string;
  pet: Pet;
  level: number;
  actualCombatPower: number;
}

interface PetCardProps {
  pet: UserPet;
  onClick?: (pet: UserPet) => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const elementIconMap: Record<string, string> = {
  fire: '/assets/element-icons/Pyro.svg',
  water: '/assets/element-icons/Hydro.svg',
  ice: '/assets/element-icons/Cryo.svg',
  thunder: '/assets/element-icons/Electro.svg',
  rock: '/assets/element-icons/Geo.svg',
  wind: '/assets/element-icons/Anemo.svg',
  grass: '/assets/element-icons/Dendro.svg',
};

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  onClick,
  selected = false,
  disabled = false,
  size = 'medium',
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(pet);
    }
  };

  const iconSrc = elementIconMap[pet.pet.element] || '';

  return (
    <div
      className={
        `${styles.petCard} ${styles[`petCard${size.charAt(0).toUpperCase() + size.slice(1)}`]} ` +
        `${selected ? styles.selectedPetCard : ''} ` +
        `${disabled ? styles.disabledPetCard : ''} ` +
        className
      }
      onClick={handleClick}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className={styles.petCardImage} style={{position: 'relative', width: '100%', height: '100%'}}>
        <img 
          src={pet.pet.img} 
          alt={pet.pet.name}
          className={styles.petImage}
          style={{width: '100%', height: '100%', objectFit: 'cover', aspectRatio: 1}}
        />
        {/* Level at top-left */}
        <span className={styles.petLevelOverlay}>Lv.{pet.level}</span>
        {/* Element icon at bottom-right */}
        {iconSrc && (
          <img src={iconSrc} alt={pet.pet.element} className={styles.petElementIcon} />
        )}
      </div>
    </div>
  );
}; 