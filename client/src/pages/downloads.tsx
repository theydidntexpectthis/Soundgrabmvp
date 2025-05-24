import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDownloadHistory } from "@/services/apiService";
import { formatTime, formatFileSize } from "@/lib/utils";
import { Download, Play, FileAudio, Calendar, Clock, Link } from "lucide-react";
import { usePlayback } from "@/components/Layout";
import { URLPasteBox } from "@/components/URLPasteBox";

export default function DownloadsPage() {
  const { data: downloads, isLoading, isError } = useQuery({
    queryKey: ['download-history'],
    queryFn: getDownloadHistory
  });
  
  const { setCurrentTrack, addToQueue } = usePlayback();
  
  const handlePlayTrack = (download: any) => {
    // Create a track object from the download info
    const track = {
      id: download.videoId,
      videoId: download.videoId,
      title: download.title,
      artist: download.artist,
      duration: 0, // We might not have this info
      views: 0,
      audioUrl: `/api/downloads/files/${download.id}`
    };
    
    setCurrentTrack(track);
    addToQueue(track);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Your Downloads</h1>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-surface">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-md" />
                    <div>
                      <Skeleton className="w-48 h-5 mb-2" />
                      <Skeleton className="w-24 h-4" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="w-10 h-10 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="bg-surface p-8 text-center">
          <h2 className="text-xl font-medium mb-2">Error Loading Downloads</h2>
          <p className="text-text-secondary mb-4">There was a problem loading your download history.</p>
          <Button>Try Again</Button>
        </Card>
      ) : downloads && downloads.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {downloads.map((download) => (
            <Card key={download.id} className="bg-surface hover:bg-surface-light transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-light rounded-md flex items-center justify-center">
                      <FileAudio className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">{download.title}</h3>
                      <p className="text-text-secondary text-sm">{download.artist}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-text-secondary text-xs gap-4">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(download.downloadDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <span className="uppercase bg-primary/20 text-primary px-2 py-1 rounded text-xs">
                        {download.format}
                      </span>
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      className="rounded-full bg-primary hover:bg-primary/90 text-white"
                      onClick={() => handlePlayTrack(download)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={() => {
                        // Create a download link
                        const a = document.createElement("a");
                        a.href = `/api/downloads/files/${download.id}`;
                        a.download = `${download.artist} - ${download.title}.${download.format}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-surface p-8 text-center">
          <h2 className="text-xl font-medium mb-2">No Downloads Yet</h2>
          <p className="text-text-secondary mb-4">You haven't downloaded any tracks yet.</p>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => window.location.href = "/search"}
          >
            Search Music
          </Button>
        </Card>
      )}
      
      {/* Ad placement */}
      <div className="mt-8 bg-surface-light rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary mb-1">Sponsored</p>
          <div className="text-sm mb-1">Premium Music Production Tools</div>
          <p className="text-xs text-text-secondary">Professional-grade audio editing software for creators.</p>
        </div>
        <Button className="bg-accent text-white px-4 py-2 rounded-lg text-sm">
          Try Free
        </Button>
      </div>
    </div>
  );
}