import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WaveAnimation } from "./WaveAnimation";
import { ProgressRing } from "./ProgressRing";
import { useToast } from "@/hooks/use-toast";
import { Track, SearchResult } from "@shared/schema";
import { usePlayback } from "./Layout";
import { searchTracks, downloadTrack, getLyrics } from "@/services/apiService";
import { 
  Play, Download, MoreVertical, Music, Clock, Calendar,
  ChevronDown, File, FileVideo, List
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTime } from "@/lib/utils";

interface SearchResultsProps {
  searchQuery: string;
}

export function SearchResults({ searchQuery }: SearchResultsProps) {
  const [sortBy, setSortBy] = useState("relevance");
  const { toast } = useToast();
  const { currentTrack, setCurrentTrack, isPlaying, togglePlayback, addToQueue } = usePlayback();
  
  const { 
    data: searchResults, 
    isLoading, 
    isError,
    error 
  } = useQuery<SearchResult>({
    queryKey: [`search-${searchQuery}-${sortBy}`],
    queryFn: () => searchTracks(searchQuery, sortBy),
    enabled: !!searchQuery,
    retry: 2,
    retryDelay: 1000,
  });
  
  const handleDownload = async (track: Track, format = "mp3") => {
    let progressToast: any;
    
    try {
      // Show initial progress
      progressToast = toast({
        title: "Downloading...",
        description: `Preparing ${track.title} for download`,
        duration: 0 // Don't auto-dismiss
      });
      
      // Use our API service to download the track
      const downloadUrl = await downloadTrack(track, format);
      
      // Dismiss progress toast
      if (progressToast) {
        progressToast.dismiss();
      }
      
      if (downloadUrl) {
        // Create a hidden anchor to trigger download
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${track.artist} - ${track.title}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Show success message
        toast({
          title: "Download Ready! 🎵",
          description: `${track.title} is downloading to your device`,
          duration: 4000
        });
      } else {
        throw new Error("Download URL not received");
      }
    } catch (error) {
      // Dismiss progress toast if still showing
      if (progressToast) {
        progressToast.dismiss();
      }
      
      console.error("Download error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      toast({
        title: "Download Failed",
        description: errorMessage.includes('API') 
          ? "Service temporarily unavailable. Please try again."
          : "Unable to download this track. Try a different format or track.",
        variant: "destructive",
        duration: 6000
      });
    }
  };
  
  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayback();
    } else {
      setCurrentTrack(track);
      addToQueue(track);
    }
  };
  
  const handleLoadMore = () => {
    // Implement pagination
  };
  
  if (!searchQuery) {
    return null;
  }
  
  return (
    <section className="mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-bold">Search Results</h2>
          <div className="flex items-center">
            <span className="text-sm text-text-secondary mr-2">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-surface-light text-text-primary text-sm p-1 rounded border-none outline-none w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <Card className="bg-surface rounded-lg overflow-hidden mb-6">
            <CardContent className="p-4 border-b border-surface-light">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="w-full md:w-48 h-48 rounded-lg" />
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div>
                      <Skeleton className="h-7 w-48 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-36" />
                      <Skeleton className="h-10 w-10" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center text-text-secondary text-sm mb-2">
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="bg-surface rounded-lg overflow-hidden mb-6 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Music className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Results Found</h3>
            <p className="text-text-secondary mb-4">
              {error instanceof Error && error.message.includes('API') 
                ? "Service temporarily unavailable. Please try again in a moment."
                : `No tracks found for "${searchQuery}". Try different keywords or check the spelling.`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="default" onClick={() => setSortBy(sortBy === 'relevance' ? 'latest' : 'relevance')}>
                Change Sort Order
              </Button>
            </div>
          </Card>
        ) : searchResults && searchResults.mainResult ? (
          <>
            <Card className="bg-surface rounded-lg overflow-hidden mb-6">
              <CardContent className="p-4 border-b border-surface-light">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Main result image - use SVG visualization for audio */}
                  <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-surface-light flex items-center justify-center">
                    <svg 
                      viewBox="0 0 100 100" 
                      className="w-full h-full"
                    >
                      {/* Audio visualization background */}
                      <rect width="100" height="100" fill="hsl(var(--surface-light))" />
                      
                      {/* Generate dynamic waveform */}
                      {Array(24).fill(0).map((_, i) => {
                        const height = 10 + Math.random() * 80;
                        return (
                          <rect 
                            key={i} 
                            x={i * 4 + 2} 
                            y={(100 - height) / 2}
                            width="3" 
                            height={height}
                            rx="1"
                            fill="hsl(var(--primary))"
                            opacity={0.7 + Math.random() * 0.3}
                          />
                        );
                      })}
                      
                      {/* Artist/title text */}
                      <text 
                        x="50" 
                        y="85" 
                        textAnchor="middle" 
                        fill="white" 
                        fontSize="6"
                        fontWeight="bold"
                      >
                        {searchResults.mainResult.artist}
                      </text>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div>
                        <h2 className="text-xl font-heading font-bold">{searchResults.mainResult.title}</h2>
                        <p className="text-text-secondary">{searchResults.mainResult.artist}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg font-medium transition-all"
                          onClick={() => handleDownload(searchResults.mainResult)}
                        >
                          <Download className="h-4 w-4 mr-2" /> Download MP3
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline"
                              className="bg-surface-light hover:bg-surface/90 text-text-primary py-2 px-3 rounded-lg transition-all"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-surface-light rounded-lg shadow-lg overflow-hidden z-10 w-48">
                            <DropdownMenuItem onClick={() => handleDownload(searchResults.mainResult, "mp3")}>
                              <Music className="h-4 w-4 mr-2" /> Download MP3
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(searchResults.mainResult, "mp4")}>
                              <FileVideo className="h-4 w-4 mr-2" /> Download MP4
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(searchResults.mainResult, "wav")}>
                              <File className="h-4 w-4 mr-2" /> Download WAV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => addToQueue(searchResults.mainResult)}>
                              <List className="h-4 w-4 mr-2" /> Add to Queue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center text-text-secondary text-sm mb-2">
                        <span className="mr-3">
                          <Play className="h-4 w-4 inline mr-1" /> {searchResults.mainResult.views} views
                        </span>
                        <span className="mr-3">
                          <Clock className="h-4 w-4 inline mr-1" /> {formatTime(searchResults.mainResult.duration)}
                        </span>
                        {searchResults.mainResult.publishDate && (
                          <span>
                            <Calendar className="h-4 w-4 inline mr-1" /> {searchResults.mainResult.publishDate}
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm line-clamp-2">
                        {searchResults.mainResult.description || `"${searchResults.mainResult.title}" is a song by ${searchResults.mainResult.artist}.`}
                      </p>
                    </div>
                    <WaveAnimation 
                      isPlaying={currentTrack?.id === searchResults.mainResult.id && isPlaying}
                    />
                  </div>
                </div>
              </CardContent>
              
              {searchResults.mainResult.lyrics && (
                <div className="p-4">
                  <h3 className="font-heading font-semibold mb-2">Lyrics Preview</h3>
                  <p className="text-text-secondary text-sm mb-4 line-clamp-4 whitespace-pre-line">
                    {searchResults.mainResult.lyrics}
                  </p>
                  <Button variant="link" className="text-primary text-sm hover:underline p-0">
                    Show more
                  </Button>
                </div>
              )}
            </Card>
            
            {/* Ad Placement - Between Results */}
            <div className="bg-surface-light rounded-lg p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-secondary mb-1">Sponsored</p>
                <div className="text-sm mb-1">Try Premium Music Production Tools</div>
                <p className="text-xs text-text-secondary">Professional-grade audio editing software for creators.</p>
              </div>
              <Button className="bg-accent text-white px-4 py-2 rounded-lg text-sm">
                Try Free
              </Button>
            </div>
            
            {searchResults.otherResults && searchResults.otherResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {searchResults.otherResults.map((result) => (
                  <Card key={result.id} className="bg-surface rounded-lg overflow-hidden flex">
                    <div className="w-24 h-24 bg-surface-light flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {/* Simple audio spectrum visualization */}
                        {Array(10).fill(0).map((_, i) => {
                          const height = 20 + Math.random() * 60;
                          return (
                            <rect 
                              key={i} 
                              x={i * 10 + 5} 
                              y={(100 - height) / 2}
                              width="5" 
                              height={height}
                              rx="2"
                              fill="hsl(var(--primary))"
                              opacity={0.5 + Math.random() * 0.5}
                            />
                          );
                        })}
                      </svg>
                    </div>
                    <CardContent className="p-3 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm">{result.title}</h3>
                          <p className="text-text-secondary text-xs">{result.artist}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-surface-light hover:bg-primary/20 text-text-primary p-1 rounded-full transition-all h-7 w-7"
                            onClick={() => handlePlay(result)}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-surface-light hover:bg-primary/20 text-text-primary p-1 rounded-full transition-all h-7 w-7"
                            onClick={() => handleDownload(result)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.random() * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-text-secondary text-xs mt-1">
                          <span>{formatTime(Math.random() * result.duration)}</span>
                          <span>{formatTime(result.duration)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="flex justify-center">
              <Button 
                variant="outline"
                className="bg-surface hover:bg-surface-light text-text-primary py-2 px-6 rounded-full transition-all"
                onClick={handleLoadMore}
              >
                Load More
              </Button>
            </div>
          </>
        ) : (
          <Card className="bg-surface rounded-lg overflow-hidden mb-6 p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No Results Found</h3>
            <p className="text-text-secondary mb-4">
              We couldn't find any results for "{searchQuery}". Try different keywords.
            </p>
          </Card>
        )}
      </div>
    </section>
  );
}
