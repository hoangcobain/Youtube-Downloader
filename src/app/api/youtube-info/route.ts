import { NextRequest, NextResponse } from 'next/server';
// Use require for ytdl-core to avoid TypeScript module issues
const ytdl = require('ytdl-core');

// Define interface for video format
interface VideoFormat {
    itag: number;
    container: string;
    qualityLabel?: string;
    contentLength?: string;
    fps?: number;
    hasVideo: boolean;
    hasAudio: boolean;
    audioQuality?: string;
}

// Define interface for audio format
interface Format {
    formatId: string;
    extension: string;
    resolution?: string;
    filesize?: number;
    audioQuality?: string;
    fps?: number;
    label: string;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
    try {
        // Parse the form data
        const formData = await request.formData();
        const url = formData.get('url');

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Validate YouTube URL
        if (!ytdl.validateURL(url)) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        // Get video info
        const info = await ytdl.getInfo(url);

        // Extract formats
        const formats = info.formats as VideoFormat[];

        // Get video details
        const videoDetails = info.videoDetails;

        // Process video formats (with video and audio)
        const videoFormats: Format[] = formats
            .filter(format => format.hasVideo && format.container === 'mp4')
            .map(format => ({
                formatId: format.itag.toString(),
                extension: format.container,
                resolution: format.qualityLabel,
                filesize: format.contentLength ? parseInt(format.contentLength) : undefined,
                fps: format.fps,
                label: `${format.qualityLabel} (${format.container})`
            }))
            .sort((a: Format, b: Format) => {
                // Extract resolution numbers for comparison
                const resA = parseInt(a.resolution?.split('p')[0] || '0');
                const resB = parseInt(b.resolution?.split('p')[0] || '0');
                return resB - resA; // Sort from highest to lowest resolution
            });

        // Deduplicate formats by resolution
        const uniqueVideoFormats: Format[] = [];
        const resolutionMap = new Map<string, boolean>();

        for (const format of videoFormats) {
            const resolution = format.resolution?.split(' ')[0] || ''; // Get the resolution part (e.g., "720p" from "720p 60fps")
            if (!resolutionMap.has(resolution)) {
                resolutionMap.set(resolution, true);
                uniqueVideoFormats.push(format);
            }
        }

        // Process audio formats
        const audioFormats: Format[] = formats
            .filter(format => !format.hasVideo && format.hasAudio)
            .map(format => ({
                formatId: format.itag.toString(),
                extension: format.container,
                audioQuality: format.audioQuality?.replace('AUDIO_QUALITY_', '') || 'Standard',
                filesize: format.contentLength ? parseInt(format.contentLength) : undefined,
                label: `${format.audioQuality?.replace('AUDIO_QUALITY_', '') || 'Standard'} (${format.container})`
            }))
            .sort((a: Format, b: Format) => {
                // Sort by quality (LOW, MEDIUM, HIGH)
                const qualityOrder: { [key: string]: number } = { LOW: 1, MEDIUM: 2, HIGH: 3 };
                const qualityA = a.audioQuality?.toUpperCase() || '';
                const qualityB = b.audioQuality?.toUpperCase() || '';

                return (qualityOrder[qualityB] || 0) - (qualityOrder[qualityA] || 0);
            });

        // Deduplicate audio formats by quality and container type
        const uniqueAudioFormats: Format[] = [];
        const audioQualityMap = new Map<string, boolean>();

        for (const format of audioFormats) {
            const qualityKey = `${format.audioQuality}-${format.extension}`;
            if (!audioQualityMap.has(qualityKey)) {
                audioQualityMap.set(qualityKey, true);
                uniqueAudioFormats.push(format);
            }
        }

        // Format duration
        const duration = formatDuration(parseInt(videoDetails.lengthSeconds));

        // Prepare response data
        const responseData = {
            title: videoDetails.title,
            thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
            duration,
            uploader: videoDetails.author.name,
            videoFormats: uniqueVideoFormats,
            audioFormats: uniqueAudioFormats
        };

        return NextResponse.json({ data: responseData });

    } catch (error) {
        console.error('Error in YouTube info API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch video info' },
            { status: 500 }
        );
    }
} 