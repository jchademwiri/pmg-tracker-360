// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Tracker 360 Docs',
			description: 'Documentation for using the Tracker 360 application.',
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Navigation Overview', slug: 'getting-started/navigation-overview' },
					],
				},
				{
					label: 'Core Workflows',
					items: [
						{ label: 'Manage Tenders', slug: 'workflows/manage-tenders' },
						{ label: 'Manage Projects and POs', slug: 'workflows/manage-projects-pos' },
					],
				},
				{
					label: 'Team and Access',
					items: [{ label: 'Invitations and Roles', slug: 'team/invitations-and-roles' }],
				},
				{
					label: 'Troubleshooting',
					items: [{ label: 'Common Issues', slug: 'troubleshooting/common-issues' }],
				},
			],
		}),
	],
});
