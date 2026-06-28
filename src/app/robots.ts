import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/dashboard", "/onboarding", "/api/"],
        },
        sitemap: "https://lemonassistantai.com/sitemap.xml",
    }
}