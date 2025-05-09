/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        domains: ['img.youtube.com', 'i.ytimg.com'],
    },
    webpack: (config, { isServer }) => {
        // Exclude ffmpeg packages from webpack bundling
        if (isServer) {
            config.externals = [...config.externals,
                '@ffmpeg-installer/ffmpeg',
                '@ffprobe-installer/ffprobe',
                'fluent-ffmpeg'
            ];
        }
        return config;
    },
    // Increase the response size limit for API routes
    experimental: {
        serverComponentsExternalPackages: [
            '@ffmpeg-installer/ffmpeg',
            '@ffprobe-installer/ffprobe',
            'fluent-ffmpeg'
        ],
    }
};

if (process.env.NEXT_PUBLIC_TEMPO) {
    nextConfig["experimental"] = {
        // NextJS 13.4.8 up to 14.1.3:
        // swcPlugins: [[require.resolve("tempo-devtools/swc/0.86"), {}]],
        // NextJS 14.1.3 to 14.2.11:
        swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]]

        // NextJS 15+ (Not yet supported, coming soon)
    }
}

module.exports = nextConfig;