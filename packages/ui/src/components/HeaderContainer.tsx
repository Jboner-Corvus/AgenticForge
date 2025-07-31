
import { Header } from './Header';
import { useStore } from '../lib/store';

export function HeaderContainer() {
  const isControlPanelVisible = useStore((state) => state.isControlPanelVisible);
  const setIsControlPanelVisible = useStore((state) => state.setIsControlPanelVisible);
  const setIsSettingsModalOpen = useStore((state) => state.setIsSettingsModalOpen);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const isHighContrastMode = useStore((state) => state.isHighContrastMode);
  const toggleHighContrastMode = useStore((state) => state.toggleHighContrastMode);
  const setCurrentPage = useStore((state) => state.setCurrentPage);
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  return (
    <Header
      isControlPanelVisible={isControlPanelVisible}
      setIsControlPanelVisible={setIsControlPanelVisible}
      setIsSettingsModalOpen={setIsSettingsModalOpen}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      isHighContrastMode={isHighContrastMode}
      toggleHighContrastMode={toggleHighContrastMode}
      isAuthenticated={isAuthenticated}
      setCurrentPage={setCurrentPage}
    />
  );
}
