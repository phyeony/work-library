<script lang="ts">
	import Fuse from 'fuse.js';
	import type { TitleEntry } from '#lib/types.ts';

	interface Props {
		titles: TitleEntry[];
		query?: string;
		onpick: (entry: TitleEntry) => void;
		placeholder?: string;
		autofocus?: boolean;
	}

	let { titles, query = $bindable(''), onpick, placeholder = 'Search titles…', autofocus = false }: Props = $props();

	const fuse = $derived(
		new Fuse(titles, {
			keys: ['title', 'titleKey'],
			threshold: 0.4,
			ignoreLocation: true
		})
	);
	const results = $derived(query.trim() ? fuse.search(query.trim(), { limit: 8 }).map((r) => r.item) : []);
</script>

<div class="search">
	<!-- svelte-ignore a11y_autofocus -->
	<input type="search" bind:value={query} {placeholder} {autofocus} autocomplete="off" />
	{#if results.length}
		<ul>
			{#each results as entry (entry.titleKey)}
				<li>
					<button onclick={() => onpick(entry)}>
						<span>{entry.title}</span>
						{#if entry.count > 1}<small>{entry.count} places</small>{/if}
					</button>
				</li>
			{/each}
		</ul>
	{:else if query.trim()}
		<p class="muted">No matching titles.</p>
	{/if}
</div>

<style>
	input {
		width: 100%;
		font-size: 1.1rem;
	}
	ul {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}
	li + li {
		border-top: 1px solid var(--border);
	}
	li button {
		width: 100%;
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		text-align: left;
		border: 0;
		border-radius: 0;
		padding: 0.75rem;
	}
	small {
		color: var(--muted);
		white-space: nowrap;
	}
</style>
