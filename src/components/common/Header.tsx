import React from 'react';
import { Destination } from '../../types';
import { AppHeader } from './AppHeader';

interface HeaderProps {
  currentDestination: Destination;
  onOpenMenu: () => void;
  onSelectDestination: (dest: Destination) => void;
  onTriggerEscalation: (reason?: string) => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenQRScanner?: () => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  return <AppHeader mode="hub" {...props} />;
};
