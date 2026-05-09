import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'XPACE DANCE | Evolução da Dança',
        short_name: 'XPACE DANCE',
        description: 'Aprenda com os maiores coreógrafos e mestres da dança urbana.',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#6324b2', // Cor Primária
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            }
        ],
    }
}
