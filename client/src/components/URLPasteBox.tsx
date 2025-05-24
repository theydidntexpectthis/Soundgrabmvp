import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, Download, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface URLPasteBoxProps {
  onDownloadComplete?: (downloads: any[]) => void;
}

interface ParsedURL {
  url: string;
  videoId: string;
  isValid: boolean;
  error?: string;
}

interface DownloadProgress {
  videoId: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  filename?: string;
  error?: string;
}

export function URLPasteBox({ onDownloadComplete }: URLPasteBoxProps) {
  const [urlText, setUrlText] = useState("");
  const [format, setFormat] = useState("mp3");
  const [parsedUrls, setParsedUrls] = useState<ParsedURL[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Parse YouTube URLs from text input
  const parseUrls = (text: string): ParsedURL[] => {
    if (!text.trim()) return [];

    // Split by commas, newlines, or spaces
    const urls = text.split(/[,\n\s]+/).filter(url => url.trim());
    
    return urls.map(url => {
      const trimmedUrl = url.trim();
      const videoId = extractVideoId(trimmedUrl);
      
      return {
        url: trimmedUrl,
        videoId: videoId || '',
        isValid: !!videoId,
        error: !videoId ? 'Invalid YouTube URL' : undefined
      };
    });
  };

  // Extract video ID from various YouTube URL formats
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|music\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  // Handle URL text change
  const handleUrlChange = (text: string) => {
    setUrlText(text);
    const parsed = parseUrls(text);
    setParsedUrls(parsed);
    
    // Reset download progress when URLs change
    setDownloadProgress([]);
  };

  // Remove a specific URL
  const removeUrl = (index: number) => {
    const newUrls = [...parsedUrls];
    newUrls.splice(index, 1);
    setParsedUrls(newUrls);
    
    // Update text
    const urlTexts = newUrls.map(u => u.url);
    setUrlText(urlTexts.join('\n'));
  };

  // Start bulk download
  const handleBulkDownload = async () => {
    const validUrls = parsedUrls.filter(url => url.isValid);
    
    if (validUrls.length === 0) {
      toast({
        title: "No Valid URLs",
        description: "Please add valid YouTube URLs to download.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Initialize progress tracking
    const initialProgress: DownloadProgress[] = validUrls.map(url => ({
      videoId: url.videoId,
      status: 'pending',
      progress: 0
    }));
    setDownloadProgress(initialProgress);

    const completedDownloads: any[] = [];

    // Process downloads one by one
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i];
      
      try {
        // Update status to downloading
        setDownloadProgress(prev => prev.map(p => 
          p.videoId === url.videoId 
            ? { ...p, status: 'downloading', progress: 25 }
            : p
        ));

        // Update progress
        setDownloadProgress(prev => prev.map(p => 
          p.videoId === url.videoId 
            ? { ...p, progress: 50 }
            : p
        ));

        // Start download
        const response = await fetch('/api/downloads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: url.videoId,
            title: 'Unknown Title',
            artist: 'Unknown Artist',
            format: format
          })
        });

        const downloadData = await response.json();

        if (downloadData.downloadUrl) {
          // Update to completed
          setDownloadProgress(prev => prev.map(p => 
            p.videoId === url.videoId 
              ? { 
                  ...p, 
                  status: 'completed', 
                  progress: 100,
                  filename: downloadData.filename 
                }
              : p
          ));

          completedDownloads.push({
            videoId: url.videoId,
            filename: downloadData.filename,
            downloadUrl: downloadData.downloadUrl
          });

          // Trigger file download
          const link = document.createElement('a');
          link.href = downloadData.downloadUrl;
          link.download = downloadData.filename || `audio.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

        } else {
          throw new Error("Download URL not received");
        }

      } catch (error) {
        console.error(`Download failed for ${url.videoId}:`, error);
        
        setDownloadProgress(prev => prev.map(p => 
          p.videoId === url.videoId 
            ? { 
                ...p, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Download failed'
              }
            : p
        ));
      }
    }

    setIsProcessing(false);
    
    if (completedDownloads.length > 0) {
      toast({
        title: "Downloads Complete",
        description: `Successfully downloaded ${completedDownloads.length} of ${validUrls.length} tracks.`
      });
      
      onDownloadComplete?.(completedDownloads);
    }
  };

  const validCount = parsedUrls.filter(url => url.isValid).length;
  const invalidCount = parsedUrls.length - validCount;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Paste YouTube URLs
        </CardTitle>
        <CardDescription>
          Paste single or multiple YouTube URLs for bulk downloading. Separate multiple URLs with commas or new lines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Paste YouTube URLs here...
Examples:
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://youtu.be/dQw4w9WgXcQ
https://music.youtube.com/watch?v=dQw4w9WgXcQ"
            value={urlText}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isProcessing}
          />
          
          {parsedUrls.length > 0 && (
            <div className="flex gap-2 text-sm">
              {validCount > 0 && (
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {validCount} Valid URL{validCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive">
                  {invalidCount} Invalid URL{invalidCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Parsed URLs Display */}
        {parsedUrls.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {parsedUrls.map((parsedUrl, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded border ${
                  parsedUrl.isValid 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {parsedUrl.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-sm truncate">
                    {parsedUrl.isValid ? `Video ID: ${parsedUrl.videoId}` : parsedUrl.error}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUrl(index)}
                  disabled={isProcessing}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Download Progress */}
        {downloadProgress.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Download Progress</h4>
            {downloadProgress.map((progress) => (
              <div key={progress.videoId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Video ID: {progress.videoId}</span>
                  <span className="capitalize">{progress.status}</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                {progress.error && (
                  <p className="text-sm text-red-600">{progress.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Format Selection and Download Button */}
        <div className="flex gap-2">
          <Select value={format} onValueChange={setFormat} disabled={isProcessing}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp3">MP3</SelectItem>
              <SelectItem value="mp4">MP4</SelectItem>
              <SelectItem value="wav">WAV</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleBulkDownload}
            disabled={validCount === 0 || isProcessing}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isProcessing 
              ? `Downloading ${downloadProgress.filter(p => p.status === 'downloading').length}...`
              : `Download ${validCount} Track${validCount !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}