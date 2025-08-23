// NOTE: Upgrade functionality components are commented out but the component remains functional

import { useState, useEffect } from 'react';
import { VersionDisplay } from './VersionDisplay';
// import { UpgradeNotification } from './UpgradeNotification';
// import { UpgradeModal } from './UpgradeModal';

interface UpdateInfo {
  hasUpdate: boolean;
  current: string;
  latest: string;
  comparison?: {
    current: string;
    latest: string;
    hasUpdate: boolean;
    severity: 'patch' | 'minor' | 'major';
    releaseNotes: string;
    releaseDate: string;
    downloadUrl: string;
    features: string[];
    bugFixes: string[];
    breakingChanges: string[];
  };
  error?: string;
}

interface UserPreferences {
  autoCheckEnabled: boolean;
  showNotifications: boolean;
  notificationPosition: 'top' | 'center' | 'bottom';
  dismissedVersions: string[];
  skippedVersions: string[];
}

export function VersionManager() {
  const [, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [, setShowModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    autoCheckEnabled: true,
    showNotifications: true,
    notificationPosition: 'top',
    dismissedVersions: [],
    skippedVersions: []
  });

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('agenticforge-upgrade-preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setUserPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse saved preferences:', error);
      }
    }
  }, []);






  return (
    <>
      {/* Version Display - always visible */}
      <VersionDisplay
        showUpdateIndicator={userPreferences.autoCheckEnabled}
        onUpdateClick={(update) => {
          setUpdateInfo(update);
          setShowModal(true);
        }}
        position="bottom-right"
        enableAutoCheck={userPreferences.autoCheckEnabled}
      />

      {/* Upgrade Notification */}
      {/* showNotification && updateInfo && !isUpgrading && (
        <UpgradeNotification
          updateInfo={updateInfo}
          onUpgrade={(update) => {
            setUpdateInfo(update);
            setShowModal(true);
            setShowNotification(false);
          }}
          onDismiss={handleDismissNotification}
          onRemindLater={handleRemindLater}
          onSkipVersion={handleSkipVersion}
          position={userPreferences.notificationPosition}
          autoHide={false}
        />
      ) */}

      {/* Upgrade Modal */}
      {/* (showModal || isUpgrading) && updateInfo && (
        <UpgradeModal
          updateInfo={updateInfo}
          isOpen={showModal || isUpgrading}
          onClose={() => setShowModal(false)}
          onStartUpgrade={handleStartUpgrade}
          onCancelUpgrade={upgradeProgress?.canCancel ? handleCancelUpgrade : undefined}
          upgradeProgress={upgradeProgress || undefined}
          isUpgrading={isUpgrading}
        />
      ) */}
    </>
  );
}

export default VersionManager;