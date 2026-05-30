// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'PMG Tracker 360 Docs',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/jchademwiri/pmg-tracker-360' }],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'System Admin Portal', slug: 'guides/admin-portal' },
						{ label: 'Tracker Client Portal', slug: 'guides/tracker-portal' },
						{ label: 'Tendering Pipeline Flow', slug: 'guides/tendering-pipeline' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
