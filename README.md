# YouTube Video Downloader

A web application that allows users to download videos and audio from YouTube for personal use.

## Features

- Input field to paste a YouTube video link
- Video information display (title, thumbnail, duration)
- Format & resolution selector (MP4, WebM, MP3, etc.)
- Download trigger with progress indication
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Supabase Edge Functions, yt-dlp
- **Database**: Supabase PostgreSQL

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase CLI
- yt-dlp installed on your server

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd youtube-downloader
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   
   Update the `.env.local` file with your Supabase credentials.

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Deploy Supabase functions
   ```bash
   supabase functions deploy
   ```

## Legal Disclaimer

This tool should only be used to download:
- Public domain or Creative Commons content
- Videos uploaded by the user themselves
- Any use must comply with YouTube's Terms of Service

## License

MIT
