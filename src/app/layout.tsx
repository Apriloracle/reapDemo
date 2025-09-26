import { Metadata } from 'next'; // Add this import

export async function generateMetadata(): Promise<Metadata> {
    return {
        other: {
        'fc:miniapp': JSON.stringify({
            version: 'next',
            imageUrl: 'https://reap.deals/embed-image.png',
            button: {
                title: `launch Reap`,
                action: {
                    type: 'launch_miniapp',
                    name: 'Reap',
                    url: 'https://reap.deals',
                    splashImageUrl: 'https://reap.deals/512x512.png',
                    splashBackgroundColor: '#ffffff',
                },
            },
        }),
        },
    };
}
