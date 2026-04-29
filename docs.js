const docsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Meta Parser API</title>
  <link rel="icon" href="https://msar.me/favicon.ico" sizes="any">
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f8f9fa; color: #333; }
    code { background: #eee; padding: 2px 5px; border-radius: 4px; }
    pre { background: #f1f1f1; padding: 1rem; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Meta Parser API</h1>
  <p>This API extracts metadata from a given URL and returns it as JSON.</p>
  
  
  <h2>Usage</h2>
  <p>GET request with a <code>?url=</code> query:</p>
  <pre><code>https://meta.msar.me/?url=https://msar.me</code></pre>
  <h2>Response</h2>
  <pre><code>{
    "title": "Saiful Alam - The Architect of Software Solutions!",
    "description": "I&#x27;m a passionate software engineer, and general technology enthusiast living in Dhaka, Bangladesh.",
    "author": "Saiful Alam Rakib"
  }</code></pre>
  <p>By default the 200 response is cached for 1 day, but you can skipp caching by adding a extra params like <code>refresh</code>.</p>

  <h2>Example</h2>
  <p>GET request with a <code>?url=&refresh</code> query:</p>
  <pre><code>https://meta.msar.me/?url=https://msar.me&refresh</code></pre>


  <footer style="margin-top: 3rem; font-size: 0.9em; color: #666;">
    &copy; <script>document.write(new Date().getFullYear())</script> Meta Parser | <a style="color:black;" target="_blank" href="https://msar.me">msar.me</a>
  </footer>
</body>
</html>`;

export default docsHtml;
