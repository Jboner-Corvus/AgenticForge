
import { SettingsModal } from './SettingsModal';
import { useUIStore } from '../store/uiStore';

export function SettingsModalContainer() {
  const isSettingsModalOpen = useUIStore((state) => state.isSettingsModalOpen);
  const setIsSettingsModalOpen = useUIStore((state) => state.setIsSettingsModalOpen);

  return (
    <SettingsModal
      isOpen={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
    />
  );
}
