
import { Header } from './Header';
import { useUIStore } from '../store/uiStore';

export function HeaderContainer() {
  const isControlPanelVisible = useUIStore((state) => state.isControlPanelVisible);
  const setIsControlPanelVisible = useUIStore((state) => state.setIsControlPanelVisible);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);
  const toggleDebugLogVisibility = useUIStore((state) => state.toggleDebugLogVisibility);

  return (
    <Header
      isControlPanelVisible={isControlPanelVisible}
      setIsControlPanelVisible={setIsControlPanelVisible}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      setCurrentPage={setCurrentPage}
      toggleDebugLogVisibility={toggleDebugLogVisibility}
    />
  );
}
