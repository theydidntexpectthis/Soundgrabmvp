import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Download, List 
} from "lucide-react";
import { usePlayback } from "./Layout";
import { formatTime } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function PlayerBar() {
  const { currentTrack, isPlaying, togglePlayback, skipNext, skipPrevious } = usePlayback();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();
  
  // Audio element reference
  const [audio] = useState(new Audio());
  
  useEffect(() => {
    // Set up audio element
    if (currentTrack?.videoId) {
      // Use streaming endpoint for real audio playback
      audio.src = `/api/stream/${currentTrack.videoId}`;
      audio.volume = volume;
      audio.muted = isMuted;
      
      if (isPlaying) {
        audio.play().catch(error => {
          console.error("Failed to play audio:", error);
          toast({
            title: "Playback Error",
            description: "Could not play this track. Try another one.",
            variant: "destructive"
          });
        });
      } else {
        audio.pause();
      }
      
      // Set up event listeners
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      
      const handleEnded = () => {
        skipNext();
      };
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      
      // Clean up
      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentTrack, isPlaying, volume, isMuted, audio, skipNext, toast]);
  
  const handleSeek = (value: number[]) => {
    if (audio) {
      const newTime = value[0];
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
      
      if (newVolume === 0) {
        setIsMuted(true);
        audio.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audio.muted = false;
      }
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audio) {
      audio.muted = !isMuted;
    }
  };
  
  const handleDownload = async () => {
    if (!currentTrack) return;
    
    try {
      toast({
        title: "Starting download",
        description: `Preparing ${currentTrack.title} for download...`
      });
      
      const response = await apiRequest("POST", "/api/downloads", {
        videoId: currentTrack.videoId,
        format: "mp3",
        title: currentTrack.title,
        artist: currentTrack.artist
      });
      
      if (response.ok) {
        toast({
          title: "Download started",
          description: `${currentTrack.title} will be downloaded shortly`
        });
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "There was an error preparing your download",
        variant: "destructive"
      });
    }
  };
  
  if (!currentTrack) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-light p-3 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center w-1/4">
          <div className="w-12 h-12 rounded-md mr-3 bg-surface-light flex items-center justify-center overflow-hidden">
            {/* Audio visualization SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {Array(8).fill(0).map((_, i) => {
                const height = isPlaying ? 30 + Math.random() * 40 : 20;
                return (
                  <rect 
                    key={i} 
                    x={i * 12 + 4} 
                    y={(100 - height) / 2}
                    width="8" 
                    height={height}
                    rx="2"
                    fill="hsl(var(--primary))"
                    opacity={0.7 + Math.random() * 0.3}
                  />
                );
              })}
            </svg>
          </div>
          <div className="truncate">
            <h4 className="font-medium text-sm truncate">{currentTrack.title}</h4>
            <p className="text-text-secondary text-xs truncate">{currentTrack.artist}</p>
          </div>
        </div>
        
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary transition-colors"
              onClick={skipPrevious}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white p-2 rounded-full transition-all h-10 w-10"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary transition-colors"
              onClick={skipNext}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center mt-1">
            <span className="text-text-secondary text-xs mr-2">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1 h-1"
            />
            <span className="text-text-secondary text-xs ml-2">{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-end w-1/4 space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary transition-colors"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20 h-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary transition-colors"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
