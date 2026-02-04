import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
    storage: {
        kind: 'github',
        repo: 'lud0914/academy52',
    },
    singletons: {
        sidebar: singleton({
            label: 'Sidebar',
            path: 'src/data/sidebar',
            format: { data: 'json' },
            schema: {
                topics: fields.array(
                    fields.object({
                        label: fields.text({ label: 'Topic Label' }),
                        link: fields.text({ label: 'Topic Link (Optional)' }),
                        items: fields.array(
                            fields.object({
                                label: fields.text({ label: 'Label' }),
                                slug: fields.text({ label: 'Page Slug (Link)' }),
                                autogenerate: fields.object({
                                    directory: fields.text({ label: 'Autogenerate Directory' }),
                                }),
                                items: fields.array(
                                    fields.object({
                                        label: fields.text({ label: 'Label' }),
                                        slug: fields.text({ label: 'Page Slug (Link)' }),
                                        autogenerate: fields.object({
                                            directory: fields.text({ label: 'Autogenerate Directory' }),
                                        }),
                                    }),
                                    {
                                        label: 'Sub Items (Level 2)',
                                        itemLabel: props => props.fields.label.value
                                    }
                                ),
                            }),
                            {
                                label: 'Items',
                                itemLabel: props => props.fields.label.value
                            }
                        ),
                    }),
                    {
                        label: 'Topics',
                        itemLabel: props => props.fields.label.value
                    }
                ),
            },
        }),
    },
    collections: {
        docs: collection({
            label: 'Docs',
            slugField: 'title',
            path: 'src/content/docs/**',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                description: fields.text({ label: 'Description' }),
                content: fields.mdx({
                    label: 'Content',
                }),
            },
        }),
    },
});
