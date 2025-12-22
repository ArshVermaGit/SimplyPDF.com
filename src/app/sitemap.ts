import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://simplypdf.vercel.app'

    // All tool pages
    const tools = [
        'merge-pdf',
        'split-pdf',
        'compress-pdf',
        'rotate-pdf',
        'jpg-to-pdf',
        'pdf-to-jpg',
        'unlock-pdf',
        'protect-pdf',
        'organize-pdf',
        'watermark-pdf',
        'sign-pdf',
        'edit-pdf',
        'pdf-to-word',
        'word-to-pdf',
        'pdf-to-excel',
        'ocr-pdf',
    ]

    const toolPages = tools.map((tool) => ({
        url: `${baseUrl}/${tool}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/history`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.3,
        },
        ...toolPages,
    ]
}
