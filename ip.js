/**
 * Welcome to Cloudflare Workers!
 *
 * This worker is a simple IP information service that responds to various endpoints with details about the client's IP address and request headers. It also includes CORS support and forces HTTPS connections.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request) {
        const url = new URL(request.url);

        // 🔒 Force HTTPS
        if (url.protocol === "http:") {
            url.protocol = "https:";
            return Response.redirect(url.toString(), 301);
        }

        const path = url.pathname;

        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        };

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const ip =
            request.headers.get("CF-Connecting-IP") ||
            request.headers.get("X-Forwarded-For") ||
            "Unknown";

        const getHeaders = () => {
            const obj = {};
            for (const [k, v] of request.headers.entries()) {
                obj[k] = v;
            }
            return obj;
        };

        const respond = (
            body,
            contentType = "application/json; charset=utf-8",
            status = 200,
        ) =>
            new Response(body, {
                status,
                headers: { "Content-Type": contentType, ...corsHeaders },
            });

        if (path === "/" || path === "/ip") {
            return respond(ip + "\n", "text/plain; charset=utf-8");
        }

        if (path === "/json") {
            return respond(
                JSON.stringify(
                    { ip, version: ip.includes(":") ? 6 : 4 },
                    null,
                    2,
                ) + "\n",
            );
        }

        if (path === "/headers") {
            return respond(JSON.stringify(getHeaders(), null, 2) + "\n");
        }

        if (path === "/ipinfo") {
            const res = await fetch(`https://ipinfo.io/${ip}`, {
                headers: { accept: "application/json" },
            });
            const data = await res.json();
            return respond(JSON.stringify(data, null, 2) + "\n");
        }

        if (path === "/details" || path === "/full") {
            return respond(
                JSON.stringify(
                    {
                        ip,
                        version: ip.includes(":") ? 6 : 4,
                        method: request.method,
                        url: request.url,
                        country: request.cf?.country || null,
                        city: request.cf?.city || null,
                        colo: request.cf?.colo || null,
                        timezone: request.cf?.timezone || null,
                        headers: getHeaders(),
                    },
                    null,
                    2,
                ) + "\n",
            );
        }

        return respond("Not Found\n", "text/plain", 404);
    },
};
