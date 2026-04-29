/**
 * Welcome to Cloudflare Workers!
 *
 * This worker is a simple maintenance page that responds with a custom HTML message when the origin server is down or returns an error status. It uses a try-catch block to handle fetch errors and checks the response status to determine if the origin is experiencing issues.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request, env, ctx) {
        try {
            const response = await fetch(request);

            // If origin returns error status
            if (response.status >= 500) {
                return new Response(MAINTENANCE_HTML, {
                    status: 503,
                    headers: { "content-type": "text/html" },
                });
            }

            return response;
        } catch (err) {
            // If origin is unreachable (timeout, DNS fail, etc.)
            return new Response(MAINTENANCE_HTML, {
                status: 503,
                headers: { "content-type": "text/html" },
            });
        }
    },
};

const MAINTENANCE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Maintenance</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {margin: 0; padding: 0;}
    body {font-family: sans-serif;text-align: center;display: flex;justify-content: center;align-items: center;flex-direction: column;height: 100vh;gap: 16px;}
  </style>
</head>
<body>
  <svg width="128px" heightdown.e-pourashava.com="128px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8.96973 22H14.9697C19.9697 22 21.9697 20 21.9697 15V9C21.9697 4 19.9697 2 14.9697 2H8.96973C3.96973 2 1.96973 4 1.96973 9V15C1.96973 20 3.96973 22 8.96973 22Z" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path opacity="0.4" d="M1.96973 12.7001L7.96973 12.6801C8.71973 12.6801 9.55973 13.2501 9.83973 13.9501L10.9797 16.8301C11.2397 17.4801 11.6497 17.4801 11.9097 16.8301L14.1997 11.0201C14.4197 10.4601 14.8297 10.4401 15.1097 10.9701L16.1497 12.9401C16.4597 13.5301 17.2597 14.0101 17.9197 14.0101H21.9797" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
  <h1>We'll be back soon</h1>
  <p>Our server is currently unavailable. Please try again later.</p>
</body>
</html>
`;
