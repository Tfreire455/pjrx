export async function healthRoutes(app) {
  app.get("/health", async () => {
    return {
      ok: true,
      service: "prjx-api",
      timestamp: new Date().toISOString()
    };
  });
}
