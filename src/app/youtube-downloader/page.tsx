import Navbar from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import Footer from '@/components/footer';
import { YoutubeDownloader } from '@/components/youtube-downloader';

export default function YoutubeDownloaderPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-12">
                <div className="flex flex-col gap-6 max-w-3xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-2">YouTube Video Downloader</h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Download videos and audio from YouTube for personal use.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Enter YouTube URL</CardTitle>
                            <CardDescription>
                                Paste a YouTube video link to get download options
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <YoutubeDownloader />
                        </CardContent>
                    </Card>

                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <InfoIcon className="h-4 w-4" />
                        <AlertDescription>
                            This tool should only be used to download public domain, Creative Commons content,
                            or videos you have permission to download. Use responsibly.
                        </AlertDescription>
                    </Alert>
                </div>
            </main>
            <Footer />
        </div>
    );
} 