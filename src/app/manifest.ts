import { MetadataRoute } from "next/types";


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'name',
		short_name: 'short_name',
		description:
			'description',
		start_url: BASE_URL + '/',
		display: 'standalone',
		background_color: '#f8f9fa',
		theme_color: '#202124',
		icons: [
			{
				src: '/favicon.ico',
				sizes: 'any',
				type: 'image/x-icon',
			},
			{
				src: '/android-chrome-192x192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/android-chrome-512x512.png',
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: '/android-chrome-maskable-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/android-chrome-maskable-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
	};
}