import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, RotateCcw, CheckCircle, RefreshCw } from 'lucide-react';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export function UpdateSettings() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check if we're in Electron
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Get current app version
      window.electronAPI.getAppVersion().then(setAppVersion);

      // Set up update listeners and store cleanup functions
      const cleanupUpdateAvailable = window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
        setUpdateAvailable(info);
        setIsChecking(false);
      });

      const cleanupDownloadProgress = window.electronAPI.onDownloadProgress((progress: DownloadProgress) => {
        setDownloadProgress(progress);
      });

      const cleanupUpdateDownloaded = window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
        setUpdateDownloaded(info);
        setDownloadProgress(null);
      });

      // Cleanup listeners on unmount
      return () => {
        if (cleanupUpdateAvailable) cleanupUpdateAvailable();
        if (cleanupDownloadProgress) cleanupDownloadProgress();
        if (cleanupUpdateDownloaded) cleanupUpdateDownloaded();
      };
    }
  }, []);

  const handleRestartApp = () => {
    if (window.electronAPI) {
      window.electronAPI.quitAndInstall();
    }
  };

  const handleCheckForUpdates = () => {
    if (window.electronAPI) {
      setIsChecking(true);
      window.electronAPI.checkForUpdates();
      
      // Reset checking state after 10 seconds if no response
      setTimeout(() => {
        setIsChecking(false);
      }, 10000);
    }
  };

  // Don't render anything if not in Electron
  if (typeof window === 'undefined' || !window.electronAPI) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App Updates</CardTitle>
          <CardDescription>
            Update functionality is only available in the desktop app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            You're running the web version. Updates are handled automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version Info */}
      <Card>
        <CardHeader>
          <CardTitle>App Version</CardTitle>
          <CardDescription>
            Current version and update status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Version</p>
              <p className="text-2xl font-bold">{appVersion || 'Loading...'}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline">
                {updateDownloaded ? 'Update Ready' :
                 updateAvailable ? 'Update Available' :
                 downloadProgress ? 'Downloading' :
                 'Up to Date'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleCheckForUpdates}
              disabled={isChecking || Boolean(downloadProgress)}
              variant="outline"
              size="sm"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check for Updates
                </>
              )}
            </Button>
            
            {updateDownloaded && (
              <Button
                onClick={handleRestartApp}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart & Update
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Status */}
      {updateDownloaded && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Update Ready to Install
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            <p className="mb-3">
              Version {updateDownloaded.version} has been downloaded and is ready to install.
            </p>
            <Button 
              onClick={handleRestartApp}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart & Update Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {downloadProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-4 w-4 mr-2 text-blue-600" />
              Downloading Update
            </CardTitle>
            <CardDescription>
              Version {updateAvailable?.version} is being downloaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress 
                value={downloadProgress.percent} 
                className="w-full" 
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{Math.round(downloadProgress.percent)}% complete</span>
                <span>
                  {(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {(downloadProgress.transferred / 1024 / 1024).toFixed(1)} MB of {(downloadProgress.total / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {updateAvailable && !downloadProgress && !updateDownloaded && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Download className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            Update Available
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <p>
              Version {updateAvailable.version} is available and will be downloaded automatically in the background.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Type declarations for the global electronAPI
declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<void>;
      quitAndInstall: () => void;
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void;
      onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void;
      onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
      platform: string;
      isElectron: boolean;
    };
  }
}