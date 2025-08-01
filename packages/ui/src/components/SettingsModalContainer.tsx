
import { SettingsModal } from './SettingsModal';
import { useStore } from '../lib/store';

export function SettingsModalContainer() {
  const isSettingsModalOpen = useStore((state) => state.isSettingsModalOpen);
  const setIsSettingsModalOpen = useStore((state) => state.setIsSettingsModalOpen);

  return (
    <SettingsModal
      isOpen={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
    />
  );
}
