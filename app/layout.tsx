import { Metadata } from 'next'; // Add this import

export async function generateMetadata(): Promise<Metadata> {
    return {
        other: {
        'fc:miniapp': JSON.stringify({
            version: 'next',
            imageUrl: 'https://www.reap.deals/embed-image.png',
            button: {
                title: `launch Reap`,
                action: {
                    type: 'launch_miniapp',
                    name: 'Reap',
                    url: 'https://www.reap.deals',
                    splashImageUrl: 'https://www.reap.deals/200x200.png',
                    splashBackgroundColor: '#ffffff',
                },
            },
        }),
        },
    };
}
