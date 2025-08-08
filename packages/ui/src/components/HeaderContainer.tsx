
import { Header } from './Header';
import { useStore } from '../lib/store';

export function HeaderContainer() {
  const isControlPanelVisible = useStore((state) => state.isControlPanelVisible);
  const setIsControlPanelVisible = useStore((state) => state.setIsControlPanelVisible);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const setCurrentPage = useStore((state) => state.setCurrentPage);
  const toggleDebugLogVisibility = useStore((state) => state.toggleDebugLogVisibility);
  const setIsSettingsModalOpen = useStore((state) => state.setIsSettingsModalOpen);

  return (
    <Header
      isControlPanelVisible={isControlPanelVisible}
      setIsControlPanelVisible={setIsControlPanelVisible}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      setCurrentPage={setCurrentPage}
      toggleDebugLogVisibility={toggleDebugLogVisibility}
      setIsSettingsModalOpen={setIsSettingsModalOpen}
    />
  );
}
