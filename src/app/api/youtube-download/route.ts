import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

// Use dynamic imports to avoid webpack bundling issues
const ytdl = require('ytdl-core');
// For server-side code only - avoids webpack bundling issues
const ffmpeg = (() => {
    try {
        const ffmpegLib = require('fluent-ffmpeg');
        const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
        const ffprobeInstaller = require('@ffprobe-installer/ffprobe');

        ffmpegLib.setFfmpegPath(ffmpegInstaller.path);
        ffmpegLib.setFfprobePath(ffprobeInstaller.path);

        return ffmpegLib;
    } catch (error) {
        console.error('Error loading ffmpeg:', error);
        throw error;
    }
})();

export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();
        const { url, format: formatId, isAudio } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        if (!ytdl.validateURL(url)) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        // Get video info
        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;
        const title = videoDetails.title.replace(/[^\w\s]/gi, '_');

        // Create a temporary directory
        const tempDir = path.join(os.tmpdir(), 'youtube-downloader');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate a unique ID for this download to prevent conflicts
        const downloadId = crypto.randomBytes(8).toString('hex');

        // For audio-only downloads
        if (isAudio) {
            // Find the specified audio format or use the best one
            const format = formatId
                ? info.formats.find((f: any) => f.itag.toString() === formatId.toString())
                : ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

            if (!format) {
                return NextResponse.json({ error: 'Selected format not available' }, { status: 400 });
            }

            // Set up file paths
            const audioOutput = path.join(tempDir, `${downloadId}-audio.${format.container}`);
            const finalOutput = path.join(tempDir, `${title}.mp3`);

            // Create promises for download and conversion
            const downloadPromise = new Promise<void>((resolve, reject) => {
                ytdl(url, { format })
                    .pipe(fs.createWriteStream(audioOutput))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            // Wait for download to complete
            await downloadPromise;

            // Convert to mp3 if needed
            if (format.container !== 'mp3') {
                await new Promise<void>((resolve, reject) => {
                    ffmpeg(audioOutput)
                        .audioBitrate(192)
                        .save(finalOutput)
                        .on('end', resolve)
                        .on('error', reject);
                });

                // Clean up the audio file
                try {
                    fs.unlinkSync(audioOutput);
                } catch (err) {
                    console.error('Error cleaning up temp files:', err);
                }

                // Read the file into memory
                const fileBuffer = fs.readFileSync(finalOutput);

                // Clean up the final output
                try {
                    fs.unlinkSync(finalOutput);
                } catch (err) {
                    console.error('Error cleaning up temp files:', err);
                }

                // Set response headers
                const headers = new Headers({
                    'Content-Disposition': `attachment; filename="${title}.mp3"`,
                    'Content-Type': 'audio/mpeg',
                });

                // Return the file as a response
                return new NextResponse(fileBuffer, { headers });
            } else {
                // Read the file into memory
                const fileBuffer = fs.readFileSync(audioOutput);

                // Clean up the audio file
                try {
                    fs.unlinkSync(audioOutput);
                } catch (err) {
                    console.error('Error cleaning up temp files:', err);
                }

                // Set response headers
                const headers = new Headers({
                    'Content-Disposition': `attachment; filename="${title}.mp3"`,
                    'Content-Type': 'audio/mpeg',
                });

                // Return the file as a response
                return new NextResponse(fileBuffer, { headers });
            }
        }
        // For video downloads
        else {
            const selectedFormat = formatId
                ? info.formats.find((f: any) => f.itag.toString() === formatId.toString())
                : null;

            // If we have a selected format with both audio and video, use direct download
            if (selectedFormat && selectedFormat.hasVideo && selectedFormat.hasAudio) {
                const videoOutput = path.join(tempDir, `${title}.${selectedFormat.container}`);

                // Download the video
                await new Promise<void>((resolve, reject) => {
                    ytdl(url, { format: selectedFormat })
                        .pipe(fs.createWriteStream(videoOutput))
                        .on('finish', resolve)
                        .on('error', reject);
                });

                // Read the file into memory
                const fileBuffer = fs.readFileSync(videoOutput);

                // Clean up the video file
                try {
                    fs.unlinkSync(videoOutput);
                } catch (err) {
                    console.error('Error cleaning up temp files:', err);
                }

                // Set response headers
                const headers = new Headers({
                    'Content-Disposition': `attachment; filename="${title}.${selectedFormat.container}"`,
                    'Content-Type': `video/${selectedFormat.container}`,
                });

                // Return the file as a response
                return new NextResponse(fileBuffer, { headers });
            }
            // For high quality videos, we need to download video and audio separately and merge them
            else {
                // Find the best video-only format (if a specific format was selected but doesn't have audio)
                let videoFormat = selectedFormat;
                if (!videoFormat || (!videoFormat.hasVideo)) {
                    // If no valid format was selected, find the best video format
                    videoFormat = ytdl.chooseFormat(info.formats.filter((f: any) => f.hasVideo && !f.hasAudio), { quality: 'highestvideo' });
                }

                // Find the best audio format
                const audioFormat = ytdl.chooseFormat(info.formats.filter((f: any) => !f.hasVideo && f.hasAudio), { quality: 'highestaudio' });

                if (!videoFormat || !audioFormat) {
                    return NextResponse.json({ error: 'Could not find suitable video or audio formats' }, { status: 400 });
                }

                // Set up file paths
                const videoOutput = path.join(tempDir, `${downloadId}-video.${videoFormat.container}`);
                const audioOutput = path.join(tempDir, `${downloadId}-audio.${audioFormat.container}`);
                const finalOutput = path.join(tempDir, `${title}.mp4`);

                // Download video and audio in parallel
                const downloadPromises = [
                    new Promise<void>((resolve, reject) => {
                        ytdl(url, { format: videoFormat })
                            .pipe(fs.createWriteStream(videoOutput))
                            .on('finish', resolve)
                            .on('error', reject);
                    }),
                    new Promise<void>((resolve, reject) => {
                        ytdl(url, { format: audioFormat })
                            .pipe(fs.createWriteStream(audioOutput))
                            .on('finish', resolve)
                            .on('error', reject);
                    })
                ];

                // Wait for downloads to complete
                await Promise.all(downloadPromises);

                // Merge audio and video using ffmpeg
                await new Promise<void>((resolve, reject) => {
                    ffmpeg()
                        .input(videoOutput)
                        .input(audioOutput)
                        .outputOptions('-c:v copy')
                        .outputOptions('-c:a aac')
                        .save(finalOutput)
                        .on('end', resolve)
                        .on('error', reject);
                });

                // Clean up intermediate files
                try {
                    fs.unlinkSync(videoOutput);
                    fs.unlinkSync(audioOutput);
                } catch (err) {
                    console.error('Error cleaning up temp files:', err);
                }

                // Read the file into memory
                const fileBuffer = fs.readFileSync(finalOutput);

                // Clean up the final output
                try {
                    fs.unlinkSync(finalOutput);
                } catch (err) {
                    console.error('Error cleaning up temp files:', err);
                }

                // Set response headers
                const headers = new Headers({
                    'Content-Disposition': `attachment; filename="${title}.mp4"`,
                    'Content-Type': 'video/mp4',
                });

                // Return the file as a response
                return new NextResponse(fileBuffer, { headers });
            }
        }
    } catch (error) {
        console.error('Error in YouTube download API:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to download video' },
            { status: 500 }
        );
    }
}

// Update to new configuration format
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set to 60 seconds to comply with Vercel hobby plan limit
export const fetchCache = 'force-no-store';

// Configure higher response size limit for larger videos
// The limit is set to 50MB
// Note: The actual response size may be limited by your hosting provider 