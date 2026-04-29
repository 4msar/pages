# Cloudflare worker scripts

This repository contains Cloudflare worker scripts that can be used to enhance the functionality of your website or application. These scripts can be deployed on Cloudflare's edge network, allowing you to run code closer to your users for improved performance and security.

## Available Scripts

- `cors.js`: A simple script that adds CORS headers to responses.
- `ip.js`: A script that provides information about the client's IP address and request headers. It also includes CORS support and forces HTTPS connections.
- `down.js`: Show when a site is down and when it will be back up, [need to add the route from CF]
- `meta.js`: A script that provides metadata about the request url, such as the title, description, user agent and referrer.
