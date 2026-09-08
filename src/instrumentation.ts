export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initRateLimitStore } = await import("@/lib/rate-limit");
    await initRateLimitStore();
  }
}
