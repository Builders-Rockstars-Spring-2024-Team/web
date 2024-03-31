/** @type {import('next').NextConfig} */
const nextConfig = {
	sassOptions: {
		includePaths: [new URL('styles', import.meta.url).pathname],
    },
};

export default nextConfig;
