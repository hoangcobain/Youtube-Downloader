import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { YoutubeDownloader } from "@/components/youtube-downloader";
import { createClient } from "../../supabase/server";
import { ArrowUpRight, CheckCircle2, Zap, Shield, Users, Video, Download } from 'lucide-react';
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke('supabase-functions-get-plans');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Download your favorite YouTube videos in just three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">1</div>
              <h3 className="text-xl font-semibold mb-4">Paste YouTube URL</h3>
              <p className="text-gray-600">Copy the URL of any YouTube video and paste it into our downloader</p>
              <div className="mt-6 h-32 bg-gray-100 rounded flex items-center justify-center">
                <div className="w-3/4 h-10 bg-gray-200 rounded flex items-center px-4 text-gray-400">https://youtube.com/watch?v=...</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">2</div>
              <h3 className="text-xl font-semibold mb-4">Select Format & Quality</h3>
              <p className="text-gray-600">Choose from available video formats and quality options</p>
              <div className="mt-6 h-32 bg-gray-100 rounded flex flex-col items-center justify-center p-4 space-y-2">
                <div className="w-full h-8 bg-gray-200 rounded flex items-center px-4 text-gray-500">1080p MP4</div>
                <div className="w-full h-8 bg-gray-200 rounded flex items-center px-4 text-gray-500">720p MP4</div>
                <div className="w-full h-8 bg-gray-200 rounded flex items-center px-4 text-gray-500">MP3 Audio</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">3</div>
              <h3 className="text-xl font-semibold mb-4">Download & Enjoy</h3>
              <p className="text-gray-600">Click the download button and save the video to your device</p>
              <div className="mt-6 h-32 bg-gray-100 rounded flex items-center justify-center">
                <div className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try It Now Section */}
      <section id="try-it-now" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Try Our Downloader Now</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Don't wait! Experience our powerful YouTube downloader directly in your browser</p>
          </div>

          <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <YoutubeDownloader />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Choose the perfect plan for your needs. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
