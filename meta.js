/**
 * Welcome to Cloudflare Workers!
 *
 * This worker is a meta parser API that extracts metadata from a given URL and returns it as JSON. It handles caching to improve performance and includes error handling for various scenarios.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import docsHtml from "./docs.js";

export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
            "Access-Control-Max-Age": "86400",
        };

        const { searchParams } = new URL(request.url);
        const targetUrl = searchParams.get("url");

        if (!targetUrl) {
            return new Response(docsHtml, {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "text/html; charset=UTF-8",
                },
            });

            // return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
            //   status: 400,
            //   headers: { "Content-Type": "application/json" },
            // });
        }

        const cache = caches.default;
        const cacheKey = new Request(targetUrl, request);

        // Try to find the response in cache
        let response = await cache.match(cacheKey);
        if (response && !searchParams.has("refresh")) {
            return response;
        }

        try {
            const res = await fetch(targetUrl, {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                        "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                    Accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
                        "image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                    Connection: "keep-alive",
                },
                redirect: "follow",
            });

            const result = await res.text();

            if (!res.ok) {
                return new Response(
                    JSON.stringify(
                        { error: "Something went wrong", result },
                        null,
                        2,
                    ),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            const metadata = extractMetaData(result);

            // return new Response(JSON.stringify(metadata, null, 2), {
            //   headers: { "Content-Type": "application/json" },
            // });

            // Clone response to save a copy in the cache
            const responseToCache = new Response(
                JSON.stringify(metadata, null, 2),
            );
            responseToCache.headers.set(
                "Cache-Control",
                "public, max-age=86400",
            );

            // Store it in the cache
            ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()));

            return responseToCache;
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            });
        }
    },
};

function extractMetaData(html) {
    const result = {};

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) {
        result.title = titleMatch[1].trim();
    }

    // Extract <meta> tags
    const metaRegex = /<meta\s+[^>]*>/gi;
    const attrRegex = /(\w+)=["']([^"']*)["']/g;

    const metaTags = html.match(metaRegex) || [];

    for (const tag of metaTags) {
        const attributes = {};
        let match;
        while ((match = attrRegex.exec(tag))) {
            attributes[match[1].toLowerCase()] = match[2];
        }

        const key = attributes.name || attributes.property;
        if (key && attributes.content) {
            result[key] = attributes.content;
        }
    }

    return result;
}
