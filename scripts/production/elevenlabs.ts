export type TtsConfig = { apiKey: string; voiceId: string; modelId: string };
export function ttsConfig(env: NodeJS.ProcessEnv): TtsConfig {
  if (!env.ELEVENLABS_API_KEY?.trim()) throw new Error("Set ELEVENLABS_API_KEY in your environment or ignored .env file.");
  if (!env.ELEVENLABS_VOICE_ID?.trim()) throw new Error("Set ELEVENLABS_VOICE_ID to the actual voice ID; a display name is not an ID.");
  const voiceId = env.ELEVENLABS_VOICE_ID.trim();
  const modelId = env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";
  if (!/^[a-zA-Z0-9_-]+$/.test(voiceId) || !/^[a-zA-Z0-9_-]+$/.test(modelId))
    throw new Error("Invalid ElevenLabs voice/model configuration; use IDs, not display names.");
  return { apiKey: env.ELEVENLABS_API_KEY.trim(), voiceId, modelId };
}

// One provider boundary, one request, no automatic retries (credits may be charged).
export async function elevenLabsSpeech(text: string, config: TtsConfig, request: typeof fetch = fetch): Promise<Buffer> {
  let response: Response;
  try {
    response = await request(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(config.voiceId)}?output_format=mp3_44100_128`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(120_000),
      headers: { "xi-api-key": config.apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: config.modelId }),
    });
  } catch {
    throw new Error("ElevenLabs network/timeout failure. No retry was made. Check provider history before retrying; the request may have consumed credits.");
  }
  if (!response.ok) {
    let quota = false;
    try { const body = await response.json(); quota = /quota|credit/i.test(String(body?.detail?.status ?? "")); } catch { /* Never log provider bodies. */ }
    const reason = quota || response.status === 402 ? "Insufficient credits/quota; check your ElevenLabs account."
      : [401, 403].includes(response.status) ? "Authentication or voice access denied; check the key, permissions and configured voice."
      : response.status === 429 ? "Rate/concurrency limit; wait before retrying."
      : "Check the configured model/voice and provider status.";
    throw new Error(`ElevenLabs HTTP ${response.status}. ${reason} No automatic retry was made.`);
  }
  if (!/^audio\/(mpeg|mp3)(;|$)/i.test(response.headers.get("content-type") ?? ""))
    throw new Error("ElevenLabs returned a non-MP3 response; narration was not replaced.");
  try {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 50 * 1024 * 1024) throw new Error();
    return bytes;
  } catch { throw new Error("ElevenLabs audio response was empty, incomplete or too large; narration was not replaced. Check provider history before retrying."); }
}
