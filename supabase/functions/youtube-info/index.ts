import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
    url: string;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { url } = await req.json() as RequestBody;

        if (!url) {
            return new Response(
                JSON.stringify({ error: "URL parameter is required" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Validate YouTube URL
        const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!youtubeUrlRegex.test(url)) {
            return new Response(
                JSON.stringify({ error: "Invalid YouTube URL" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Use yt-dlp to extract video information
        const ytDlpCommand = new Deno.Command("yt-dlp", {
            args: [
                "-J",  // Output JSON
                "--no-check-certificate",  // Avoid certificate issues
                "--no-playlist",  // Don't process playlists
                url
            ],
        });

        const ytDlpOutput = await ytDlpCommand.output();

        if (!ytDlpOutput.success) {
            const errorText = new TextDecoder().decode(ytDlpOutput.stderr);
            console.error("yt-dlp error:", errorText);

            return new Response(
                JSON.stringify({ error: "Failed to extract video information" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const rawData = new TextDecoder().decode(ytDlpOutput.stdout);
        const videoData = JSON.parse(rawData);

        // Process formats to organize them into video and audio formats
        const videoFormats = [];
        const audioFormats = [];

        for (const format of videoData.formats) {
            // Skip formats with no video or audio
            if (!format.vcodec || format.vcodec === "none") continue;

            // If this is a video+audio format or a video-only format
            if (format.vcodec !== "none") {
                // Ensure we have some kind of resolution info
                const resolution = format.resolution || `${format.width}x${format.height}` || "Unknown";

                videoFormats.push({
                    formatId: format.format_id,
                    extension: format.ext,
                    resolution: resolution,
                    filesize: format.filesize,
                    fps: format.fps,
                    label: `${resolution} (${format.ext})`,
                });
            }

            // Audio-only formats
            if (format.acodec !== "none" && format.vcodec === "none") {
                audioFormats.push({
                    formatId: format.format_id,
                    extension: format.ext,
                    audioQuality: `${format.acodec || "Unknown"} ${format.abr ? format.abr + "kbps" : ""}`,
                    filesize: format.filesize,
                    label: `${format.ext.toUpperCase()} Audio`,
                });
            }
        }

        // Sort video formats by resolution (height) in descending order
        videoFormats.sort((a, b) => {
            const heightA = a.resolution?.split('x')[1] ? parseInt(a.resolution.split('x')[1]) : 0;
            const heightB = b.resolution?.split('x')[1] ? parseInt(b.resolution.split('x')[1]) : 0;
            return heightB - heightA;
        });

        // Format duration in MM:SS
        const formatDuration = (seconds: number): string => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        };

        const videoInfo = {
            title: videoData.title,
            thumbnail: videoData.thumbnail,
            duration: formatDuration(videoData.duration),
            uploader: videoData.uploader,
            videoFormats,
            audioFormats,
        };

        return new Response(
            JSON.stringify(videoInfo),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error processing request:", error);

        return new Response(
            JSON.stringify({ error: "Failed to process the video information" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
}); 