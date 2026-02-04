// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import mermaid from 'astro-mermaid';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import fs from 'node:fs';
import path from 'node:path';

import vercel from '@astrojs/vercel';

const sidebarData = JSON.parse(fs.readFileSync('./src/data/sidebar.json', 'utf-8'));

function cleanSidebarData(items) {
    if (!items) return [];
    return items.map(item => {
        const newItem = { ...item };

        // Handle autogenerate
        if (newItem.autogenerate) {
            // If directory is missing/empty, delete the whole autogenerate object
            if (!newItem.autogenerate.directory) {
                delete newItem.autogenerate;
            } else {
                // If valid autogenerate, it shouldn't have slug/items/link usually
                delete newItem.slug;
                delete newItem.link;
                delete newItem.items;
            }
        }

        // Recursively clean children
        if (newItem.items) {
            newItem.items = cleanSidebarData(newItem.items);
            if (newItem.items.length === 0) {
                // Keep the items array if it exists (empty group), or delete?
                // Starlight allows empty groups.
            }
        }

        // Sanitize slug: remove leading/trailing slashes
        if (newItem.slug) {
            newItem.slug = newItem.slug.replace(/^\/+|\/+$/g, '');

            // Validate that the content file exists
            const extensions = ['.md', '.mdx'];
            const pathsToCheck = extensions.flatMap(ext => [
                newItem.slug + ext,
                path.join(newItem.slug, 'index' + ext)
            ]);

            const fileExists = pathsToCheck.some(p =>
                fs.existsSync(path.resolve('./src/content/docs', p))
            );

            if (!fileExists) {
                console.warn(`Warning: Sidebar link "${newItem.slug}" removed because content file does not exist.`);
                console.log('Checked paths:', pathsToCheck.map(p => path.resolve('./src/content/docs', p)));
                // If it's a leaf node (link), invalidate it so it gets filtered out
                delete newItem.slug;
                delete newItem.link;
                // If it was just a link, it might become an empty object, which will be filtered below.
            }
        }

        return newItem;
    }).filter(item => {
        // Must have at least one valid Starlight property
        const hasAutogenerate = !!(item.autogenerate && item.autogenerate.directory);
        const hasLink = !!item.link || !!item.slug;
        const hasItems = Array.isArray(item.items); // Group
        const hasLabel = !!item.label;

        // Label is required for everything except autogenerate (sometimes)
        if (!hasLabel) return false;

        return hasAutogenerate || hasLink || hasItems;
    });
}

if (sidebarData.topics) {
    sidebarData.topics.forEach(topic => {
        if (topic.items) {
            topic.items = cleanSidebarData(topic.items);
        }
    });
}



// https://astro.build/config
export default defineConfig({
    output: 'server',

    vite: {
        plugins: [{
            name: 'watch-sidebar',
            configureServer(server) {
                server.watcher.add(path.resolve('./src/data/sidebar.json'));
                server.watcher.on('change', (file) => {
                    if (file.includes('sidebar.json')) {
                        console.log('Sidebar configuration changed, restarting server...');
                        server.restart();
                    }
                });
            }
        }]
    },

    integrations: [
        starlight({
            title: 'Academy52',
            customCss: [
                './src/styles/custom.css',
            ],
            components: {
                Pagination: './src/components/CustomPagination.astro',
                Head: './src/components/Head.astro',
                SocialIcons: './src/components/SocialIcons.astro',
            },
            plugins: [
                starlightSidebarTopics(sidebarData.topics),
            ],
        }),
        mermaid(),
        react(),
        keystatic(),
    ],

    adapter: vercel()
});