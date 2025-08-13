
import { SettingsModal } from './SettingsModal';
import { useCombinedStore as useStore } from '../store';

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
