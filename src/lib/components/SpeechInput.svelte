<script lang="ts">
	import { speechRecognition } from '#lib/speech.ts';

	interface Props {
		onresult: (text: string) => void;
	}

	let { onresult }: Props = $props();

	const Recognition = speechRecognition();

	/** Browser speech error codes, explained. */
	const ERRORS: Record<string, string> = {
		network:
			"This browser couldn't reach its speech service. Use Google Chrome or Safari (Brave, Arc and similar browsers often can't), and check that no VPN or ad blocker is blocking it.",
		'not-allowed': 'Microphone permission was denied. Allow the microphone for this site in your browser settings.',
		'service-not-allowed':
			'Speech recognition is turned off on this device. On a Mac, turn on Dictation in System Settings → Keyboard.',
		'audio-capture': 'No microphone was found.',
		'no-speech': "Didn't hear anything. Tap the button and say the title.",
		'language-not-supported': "This browser doesn't support speech in the selected language."
	};

	let lang = $state<'ko-KR' | 'en-US'>('en-US');
	let listening = $state(false);
	let heard = $state('');
	let error = $state('');
	let recognition: any = null;

	function start() {
		error = '';
		heard = '';
		if (!Recognition) return;
		recognition = new Recognition();
		recognition.lang = lang;
		recognition.interimResults = true;
		recognition.maxAlternatives = 1;
		recognition.onresult = (event: any) => {
			const result = event.results[event.results.length - 1];
			heard = result[0].transcript;
			if (result.isFinal) onresult(heard.trim());
		};
		recognition.onerror = (event: any) => {
			error = ERRORS[event.error] ?? `Speech recognition failed (${event.error}).`;
		};
		recognition.onend = () => (listening = false);
		recognition.start();
		listening = true;
	}

	function stop() {
		recognition?.stop();
	}
</script>

{#if !Recognition}
	<p class="muted">Speech input isn't available in this browser. Use Search, or open the app in Safari or Chrome.</p>
{:else}
	<div class="speech">
		<div class="lang" role="group" aria-label="Language">
			<button class:active={lang === 'ko-KR'} onclick={() => (lang = 'ko-KR')}>한국어</button>
			<button class:active={lang === 'en-US'} onclick={() => (lang = 'en-US')}>English</button>
		</div>
		<button class="mic" class:listening onclick={listening ? stop : start}>
			{listening ? '■ Stop' : '🎤 Say the title'}
		</button>
		{#if heard}<p>“{heard}”</p>{/if}
		{#if error}<p class="error">{error}</p>{/if}
	</div>
{/if}

<style>
	.speech {
		display: grid;
		gap: 0.75rem;
		justify-items: center;
	}
	.lang {
		display: flex;
		gap: 0.25rem;
	}
	.lang button.active {
		background: var(--accent);
		color: var(--on-accent);
		border-color: var(--accent);
	}
	.mic {
		font-size: 1.2rem;
		padding: 1rem 2rem;
		border-radius: 999px;
	}
	.mic.listening {
		background: var(--danger);
		color: #fff;
		border-color: var(--danger);
	}
	.error {
		color: var(--danger);
	}
</style>
