import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FeedbackButton } from './FeedbackButton';

interface VersionInfo {
  version: string;
  timestamp: string;
  buildDate: string;
}

interface VersionDisplayProps {
  className?: string;
  showDetails?: boolean;
  showFeedbackButton?: boolean;
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({ 
  className = "", 
  showDetails = false,
  showFeedbackButton = false
}) => {
  const { data: versionInfo } = useQuery<VersionInfo>({
    queryKey: ['/api/version'],
    queryFn: () => fetch('/api/version').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (!versionInfo) {
    return null;
  }

  if (showDetails) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        <div className="space-y-1">
          <div>Version: v.{versionInfo.version}</div>
          <div>Built: {versionInfo.buildDate}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-gray-400 ${className}`}>
      <span>v.{versionInfo.version}</span>
      {showFeedbackButton && <FeedbackButton />}
    </div>
  );
};