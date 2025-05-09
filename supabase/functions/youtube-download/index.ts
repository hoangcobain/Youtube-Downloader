import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
    url: string;
    format: string;
    quality?: string;
    isAudio?: boolean;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { url, format, quality, isAudio } = await req.json() as RequestBody;

        if (!url || !format) {
            return new Response(
                JSON.stringify({ error: "URL and format parameters are required" }),
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

        // Create a temporary directory for the download
        const tempDir = await Deno.makeTempDir();

        // Set up arguments for yt-dlp
        const args = [
            "--no-check-certificate",       // Skip certificate validation
            "--no-playlist",                // Don't process playlists 
            "--no-part",                    // Don't use .part files
            "-f", format,                   // Selected format
            "-o", `${tempDir}/%(title)s.%(ext)s`, // Output filename template
            url                             // YouTube URL
        ];

        if (isAudio) {
            args.splice(4, 0, "--extract-audio");  // Extract audio from video
        }

        // Execute yt-dlp to download the video
        const ytDlpCommand = new Deno.Command("yt-dlp", { args });
        const ytDlpOutput = await ytDlpCommand.output();

        if (!ytDlpOutput.success) {
            const errorText = new TextDecoder().decode(ytDlpOutput.stderr);
            console.error("yt-dlp error:", errorText);

            return new Response(
                JSON.stringify({ error: "Failed to download video" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Find the downloaded file in the temp directory
        const files = [];
        for await (const entry of Deno.readDir(tempDir)) {
            if (entry.isFile) {
                files.push(entry.name);
            }
        }

        if (files.length === 0) {
            return new Response(
                JSON.stringify({ error: "No file was downloaded" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Get the downloaded file
        const downloadedFile = files[0];
        const filePath = `${tempDir}/${downloadedFile}`;

        // Read the file content
        const fileContent = await Deno.readFile(filePath);

        // Get file extension and set content type
        const fileExt = downloadedFile.split(".").pop() || "";
        let contentType = "application/octet-stream";

        // Set common content types
        const contentTypes: { [key: string]: string } = {
            "mp4": "video/mp4",
            "webm": "video/webm",
            "mp3": "audio/mpeg",
            "m4a": "audio/mp4",
            "opus": "audio/opus",
            "ogg": "audio/ogg"
        };

        if (contentTypes[fileExt]) {
            contentType = contentTypes[fileExt];
        }

        // Create a presigned URL for the file or return the file directly
        // For simplicity, we'll return the file directly
        return new Response(fileContent, {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${downloadedFile}"`,
            }
        });
    } catch (error) {
        console.error("Error processing download request:", error);

        return new Response(
            JSON.stringify({ error: "Failed to process the download request" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
}); 