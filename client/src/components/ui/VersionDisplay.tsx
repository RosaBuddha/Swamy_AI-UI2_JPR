import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface VersionInfo {
  version: string;
  timestamp: string;
  buildDate: string;
}

interface VersionDisplayProps {
  className?: string;
  showDetails?: boolean;
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({ 
  className = "", 
  showDetails = false 
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
    <div className={`text-xs text-gray-400 ${className}`}>
      v.{versionInfo.version}
    </div>
  );
};