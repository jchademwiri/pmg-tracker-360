// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.tendertrack360.co.za',
	integrations: [
		starlight({
			title: 'PMG Tracker 360 User Guide',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/jchademwiri/pmg-tracker-360' }],
			sidebar: [
				{
					label: 'Getting Started',
					autogenerate: { directory: 'getting-started' },
				},
				{
					label: 'Organization & Teams',
					autogenerate: { directory: 'organization' },
				},
				{
					label: 'Procurement Workflows',
					autogenerate: { directory: 'workflows' },
				},
				{
					label: 'Tools & Intelligence',
					autogenerate: { directory: 'tools' },
				},
				{
					label: 'Account & Billing',
					autogenerate: { directory: 'account' },
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});


