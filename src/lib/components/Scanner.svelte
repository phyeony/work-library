<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		/** Called with the raw barcode value. Repeats of the same code are ignored for 2.5s. */
		ondetect: (code: string) => void;
		paused?: boolean;
	}

	let { ondetect, paused = false }: Props = $props();

	const FORMATS = ['ean_13', 'ean_8', 'upc_a'] as const;

	let video: HTMLVideoElement;
	let stream: MediaStream | null = null;
	let timer: ReturnType<typeof setInterval> | undefined;
	let status = $state<'starting' | 'running' | 'error'>('starting');
	let message = $state('');
	let last = { code: '', at: 0 };

	interface Detector {
		detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
	}

	async function createDetector(): Promise<Detector> {
		const Native = (globalThis as { BarcodeDetector?: any }).BarcodeDetector;
		if (Native) {
			const supported: string[] = await Native.getSupportedFormats();
			if (supported.includes('ean_13')) return new Native({ formats: [...FORMATS] });
		}
		// Self-host the decoder instead of letting the library fetch it from a CDN.
		const [{ BarcodeDetector, setZXingModuleOverrides }, { default: wasmUrl }] = await Promise.all([
			import('barcode-detector/ponyfill'),
			import('zxing-wasm/reader/zxing_reader.wasm?url')
		]);
		setZXingModuleOverrides({
			locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path)
		});
		return new BarcodeDetector({ formats: [...FORMATS] });
	}

	onMount(async () => {
		if (!navigator.mediaDevices?.getUserMedia) {
			status = 'error';
			message = 'Camera is not available. The site must be opened over HTTPS.';
			return;
		}
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
				audio: false
			});
			video.srcObject = stream;
			await video.play();
			const detector = await createDetector();
			status = 'running';
			let busy = false;
			timer = setInterval(async () => {
				if (paused || busy || video.readyState < 2) return;
				busy = true;
				try {
					const [hit] = await detector.detect(video);
					const now = Date.now();
					if (hit && !(hit.rawValue === last.code && now - last.at < 2500)) {
						last = { code: hit.rawValue, at: now };
						navigator.vibrate?.(60);
						ondetect(hit.rawValue);
					}
				} catch {
					// a dropped frame; try the next one
				} finally {
					busy = false;
				}
			}, 200);
		} catch (e) {
			status = 'error';
			message =
				e instanceof DOMException && e.name === 'NotAllowedError'
					? 'Camera permission was denied. Allow camera access in your browser settings.'
					: 'Could not start the camera.';
		}
	});

	onDestroy(() => {
		clearInterval(timer);
		stream?.getTracks().forEach((t) => t.stop());
	});
</script>

<div class="scanner" class:paused>
	<!-- svelte-ignore a11y_media_has_caption -->
	<video bind:this={video} playsinline muted></video>
	<div class="guide" aria-hidden="true"></div>
	{#if status === 'starting'}
		<p class="overlay">Starting camera…</p>
	{:else if status === 'error'}
		<p class="overlay error">{message}</p>
	{:else if paused}
		<p class="overlay">Paused</p>
	{/if}
</div>

<style>
	.scanner {
		position: relative;
		aspect-ratio: 4 / 3;
		max-height: 45vh;
		width: 100%;
		background: #000;
		border-radius: var(--radius);
		overflow: hidden;
	}
	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.paused video {
		opacity: 0.4;
	}
	.guide {
		position: absolute;
		inset: 35% 12%;
		border: 2px solid rgb(255 255 255 / 0.8);
		border-radius: 8px;
		box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.25);
	}
	.overlay {
		position: absolute;
		inset: auto 0 0 0;
		margin: 0;
		padding: 0.6rem;
		color: #fff;
		background: rgb(0 0 0 / 0.6);
		text-align: center;
	}
	.error {
		background: rgb(160 30 30 / 0.85);
	}
</style>
