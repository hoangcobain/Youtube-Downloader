'use client';

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, DownloadIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from './ui/use-toast';

type Format = {
    formatId: string;
    extension: string;
    resolution?: string;
    filesize?: number;
    audioQuality?: string;
    fps?: number;
    label: string;
};

type VideoInfo = {
    title: string;
    thumbnail: string;
    duration: string;
    uploader: string;
    videoFormats: Format[];
    audioFormats: Format[];
};

export function YoutubeDownloader() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [downloading, setDownloading] = useState(false);

    async function fetchVideoInfo(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setVideoInfo(null);

        try {
            const formData = new FormData();
            formData.append('url', url);

            const response = await fetch('/api/youtube-info', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch video info');
            }

            const data = await response.json();
            setVideoInfo(data.data);
            console.log('videoInfo', data);
        } catch (error) {
            console.error('Error fetching video info:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to fetch video information',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    async function downloadVideo(format: Format, isAudio: boolean) {
        setDownloading(true);
        try {
            // Create a loading toast
            const loadingToast = toast({
                title: 'Starting Download',
                description: 'Preparing your download...',
            });

            // Use the new API endpoint
            const response = await fetch('/api/youtube-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    format: format.formatId,
                    isAudio,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to download video');
            }

            // Create a blob from the streaming response
            const blob = await response.blob();

            // Get filename from content-disposition header or use a default
            const contentDisposition = response.headers.get('content-disposition');
            const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            const filename = filenameMatch ? filenameMatch[1] : `youtube-video.${isAudio ? 'mp3' : 'mp4'}`;

            // Create a download URL
            const downloadUrl = window.URL.createObjectURL(blob);

            // Create a temporary link element and trigger the download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            // Success toast
            toast({
                title: 'Download Started',
                description: `Your file "${filename}" is being downloaded`,
            });

        } catch (error) {
            console.error('Error downloading video:', error);
            toast({
                title: 'Download Error',
                description: error instanceof Error ? error.message : 'Failed to download video',
                variant: 'destructive',
            });
        } finally {
            setDownloading(false);
        }
    }

    function formatFileSize(bytes?: number) {
        if (!bytes) return 'Unknown size';

        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <form onSubmit={fetchVideoInfo} className="flex gap-2">
                <div className="flex-1">
                    <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        required
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {loading ? 'Loading...' : 'Get Info'}
                </Button>
            </form>

            {videoInfo && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-1/3">
                                <div className="relative aspect-video w-full rounded-md overflow-hidden">
                                    <Image
                                        src={videoInfo.thumbnail}
                                        alt={videoInfo.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <h2 className="text-xl font-semibold">{videoInfo.title}</h2>
                                <p className="text-sm text-gray-500">
                                    {videoInfo.uploader} • {videoInfo.duration}
                                </p>

                                <Tabs defaultValue="video" className="mt-4">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="video">Video</TabsTrigger>
                                        <TabsTrigger value="audio">Audio Only</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="video" className="mt-4">
                                        <div className="grid gap-2">
                                            {videoInfo.videoFormats.map((format) => (
                                                <div
                                                    key={format.formatId}
                                                    className="flex justify-between items-center p-2 border rounded hover:bg-gray-50"
                                                >
                                                    <div>
                                                        <span className="font-medium">{format.resolution || 'Unknown'}</span>
                                                        <span className="text-sm text-gray-500 ml-2">
                                                            {format.extension.toUpperCase()} {format.fps ? `${format.fps}fps` : ''}
                                                        </span>
                                                        {format.filesize && (
                                                            <span className="text-xs text-gray-400 ml-2">
                                                                {formatFileSize(format.filesize)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => downloadVideo(format, false)}
                                                        disabled={downloading}
                                                    >
                                                        {downloading ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <DownloadIcon className="h-4 w-4" />
                                                        )}
                                                        <span className="ml-2">Download</span>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="audio" className="mt-4">
                                        <div className="grid gap-2">
                                            {videoInfo.audioFormats.map((format) => (
                                                <div
                                                    key={format.formatId}
                                                    className="flex justify-between items-center p-2 border rounded hover:bg-gray-50"
                                                >
                                                    <div>
                                                        <span className="font-medium">{format.audioQuality || 'Standard'}</span>
                                                        <span className="text-sm text-gray-500 ml-2">
                                                            {format.extension.toUpperCase()}
                                                        </span>
                                                        {format.filesize && (
                                                            <span className="text-xs text-gray-400 ml-2">
                                                                {formatFileSize(format.filesize)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => downloadVideo(format, true)}
                                                        disabled={downloading}
                                                    >
                                                        {downloading ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <DownloadIcon className="h-4 w-4" />
                                                        )}
                                                        <span className="ml-2">Download</span>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 