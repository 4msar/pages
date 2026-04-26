export default {
  async fetch(request, env, ctx) {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const email = (body.email || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 422 });
    }

    const host = new URL(request.url).hostname;

    const token = env.SILO_API_KEY;
    if (!token) {
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    try {
      const apiResponse = await fetch(
        "https://silo.msar.dev/api/v1/values/coming-soon",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: "Email subscription",
            type: host,
            value: email,
          }),
        },
      );

      if (!apiResponse.ok) {
        return Response.json({ error: "Upstream API error" }, { status: 502 });
      }

      return Response.json({ success: true }, { status: 200 });
    } catch {
      return Response.json({ error: "Network error" }, { status: 502 });
    }
  },
};
