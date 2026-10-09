/**
 * The browser's speech recognition class, or undefined where speech can't work.
 * Brave exposes the API but strips Google's speech service, so every attempt fails
 * with a "network" error; treat it as unsupported.
 */
export function speechRecognition(): (new () => any) | undefined {
	if (typeof window === 'undefined') return undefined;
	if ((navigator as { brave?: unknown }).brave) return undefined;
	return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
}
