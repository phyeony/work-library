<script lang="ts">
	import LocationCard from '#lib/components/LocationCard.svelte';
	import Scanner from '#lib/components/Scanner.svelte';
	import SpeechInput from '#lib/components/SpeechInput.svelte';
	import TitleSearch from '#lib/components/TitleSearch.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { speechRecognition } from '#lib/speech.ts';
	import type { Location, TitleEntry } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Mode = 'scan' | 'search' | 'speak';
	type Result =
		| { kind: 'found'; locations: Location[]; via: string; autoLinked?: { isbn: string; hint: string } }
		| { kind: 'unlinked'; isbn: string; hint: string | null }
		| { kind: 'error'; message: string };

	let mode = $state<Mode>('scan');
	let query = $state('');
	let linkQuery = $state('');
	let loading = $state(false);
	let result = $state<Result | null>(null);
	// Hidden where the browser can't do speech (e.g. Brave, Firefox). Checked after hydration.
	let canSpeak = $state(false);

	onMount(() => {
		canSpeak = Boolean(speechRecognition());
	});

	async function getJson(url: string, init?: RequestInit) {
		const res = await fetch(url, init);
		if (!res.ok) throw new Error((await res.text()) || res.statusText);
		return res.json();
	}

	async function run(task: () => Promise<Result>) {
		loading = true;
		try {
			result = await task();
		} catch (e) {
			result = { kind: 'error', message: e instanceof Error ? e.message : String(e) };
		} finally {
			loading = false;
		}
	}

	function onScan(code: string) {
		run(async () => {
			const r = await getJson(`/api/isbn/${encodeURIComponent(code)}`);
			if (r.titleKey) {
				const autoLinked = r.autoLinked ? { isbn: r.isbn, hint: r.hint } : undefined;
				return { kind: 'found', locations: r.locations, via: `Barcode ${r.isbn}`, autoLinked };
			}
			linkQuery = r.hint ?? '';
			return { kind: 'unlinked', isbn: r.isbn, hint: r.hint };
		});
	}

	function onPick(entry: TitleEntry) {
		run(async () => {
			const r = await getJson(`/api/locate?key=${encodeURIComponent(entry.titleKey)}`);
			return { kind: 'found', locations: r.locations, via: entry.title };
		});
	}

	function linkTo(isbn: string, entry: TitleEntry) {
		run(async () => {
			await getJson('/api/links', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ isbn, titleKey: entry.titleKey })
			});
			invalidateAll();
			const r = await getJson(`/api/locate?key=${encodeURIComponent(entry.titleKey)}`);
			return { kind: 'found', locations: r.locations, via: `Linked ${isbn}` };
		});
	}

	/** Undoes an automatic match and lets the user pick the right title. */
	function wrongMatch(isbn: string, hint: string) {
		run(async () => {
			await getJson('/api/links', {
				method: 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ isbn })
			});
			invalidateAll();
			linkQuery = '';
			return { kind: 'unlinked', isbn, hint };
		});
	}

	function onSpeech(text: string) {
		query = text;
		mode = 'search';
	}

	function setMode(m: Mode) {
		mode = m;
		result = null;
	}
</script>

<div class="stack">
	<div class="modes" role="tablist">
		<button role="tab" aria-selected={mode === 'scan'} class:active={mode === 'scan'} onclick={() => setMode('scan')}>
			📷 Scan
		</button>
		<button role="tab" aria-selected={mode === 'search'} class:active={mode === 'search'} onclick={() => setMode('search')}>
			🔎 Search
		</button>
		{#if canSpeak}
			<button role="tab" aria-selected={mode === 'speak'} class:active={mode === 'speak'} onclick={() => setMode('speak')}>
				🎤 Speak
			</button>
		{/if}
	</div>

	{#if mode === 'scan'}
		<Scanner ondetect={onScan} paused={loading || result?.kind === 'unlinked'} />
		<p class="muted hint">Point the camera at the barcode on the back cover.</p>
	{:else if mode === 'search'}
		<TitleSearch titles={data.titles} bind:query onpick={onPick} autofocus />
	{:else}
		<SpeechInput onresult={onSpeech} />
	{/if}

	{#if loading}
		<p class="muted">Looking up…</p>
	{:else if result?.kind === 'error'}
		<p class="error">{result.message}</p>
	{:else if result?.kind === 'unlinked'}
		{@const isbn = result.isbn}
		<section class="unlinked stack">
			<div>
				<h2>New barcode</h2>
				<p>
					<code>{isbn}</code> isn't linked to a book yet.
					{#if result.hint}Book databases say: <strong>{result.hint}</strong>.{/if}
				</p>
				<p class="muted">Pick the title from your list to link it. You only need to do this once.</p>
			</div>
			<TitleSearch titles={data.titles} bind:query={linkQuery} onpick={(e) => linkTo(isbn, e)} />
			<button onclick={() => (result = null)}>Cancel</button>
		</section>
	{:else if result?.kind === 'found'}
		<section class="stack">
			<p class="muted via">
				{result.via}
				{#if result.locations.length > 1}· <strong>{result.locations.length} places</strong>{/if}
			</p>
			{#if result.autoLinked}
				{@const auto = result.autoLinked}
				<p class="auto">
					✨ Matched automatically (book databases call it “{auto.hint}”).
					<button onclick={() => wrongMatch(auto.isbn, auto.hint)}>Wrong book?</button>
				</p>
			{/if}
			{#each result.locations as location (location.book.id)}
				<LocationCard {location} />
			{:else}
				<p>This title is no longer on any shelf.</p>
			{/each}
		</section>
	{/if}
</div>

<style>
	.modes {
		display: grid;
		grid-auto-columns: 1fr;
		grid-auto-flow: column;
		gap: 0.4rem;
	}
	.modes button {
		padding: 0.7rem 0.4rem;
	}
	.modes button.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
	}
	.hint {
		margin: -0.5rem 0 0;
		text-align: center;
		font-size: 0.9rem;
	}
	.unlinked {
		padding: 1rem;
		border: 2px dashed var(--accent-2);
		border-radius: var(--radius);
	}
	.unlinked h2 {
		margin: 0 0 0.25rem;
	}
	.via {
		margin: 0;
	}
	.auto {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}
	.auto button {
		font-size: 0.85rem;
		padding: 0.3rem 0.6rem;
	}
	.error {
		color: var(--danger);
	}
</style>
