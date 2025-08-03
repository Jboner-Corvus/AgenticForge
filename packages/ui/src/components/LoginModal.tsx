import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Modal } from './ui/modal';
import { useLanguage } from '../lib/contexts/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { translations } = useLanguage();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={translations.login}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="text-right">
          {translations.email}
        </Label>
        <Input id="email" type="email" name="email" autoComplete="email" className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="password" className="text-right">
          {translations.password}
        </Label>
        <Input id="password" type="password" name="password" autoComplete="current-password" className="col-span-3" />
      </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">{translations.login}</Button>
      </div>
    </Modal>
  );
};
