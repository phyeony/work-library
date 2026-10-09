<script lang="ts">
	import { coverUrl, periodText, type BookRef, type Location } from '#lib/types.ts';

	let { location }: { location: Location } = $props();

	const { book, shelf, row, index, total, prev, next } = $derived(location);
</script>

{#snippet neighbor(label: string, b: BookRef | null, edge: string)}
	<div class="neighbor">
		<small>{label}</small>
		{#if b}
			{@render cover(b.isbn, 'small')}
			<strong>{b.title}</strong>
			<span class="muted">{periodText(b)}{b.periodLabel !== book.periodLabel ? ' · different month' : ''}</span>
		{:else}
			<span class="muted">{edge}</span>
		{/if}
	</div>
{/snippet}

{#snippet cover(isbn: string | null, size: string)}
	{#if coverUrl(isbn)}
		<img
			class={size}
			src={coverUrl(isbn)}
			alt=""
			loading="lazy"
			onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
		/>
	{/if}
{/snippet}

<article class="card">
	<header>
		{@render cover(book.isbn, 'large')}
		<div>
			<h2>{book.title}</h2>
			<p class="where">
				<a href="/shelves/{shelf.id}">{shelf.name}</a>
			</p>
			<div class="badges">
				<span class="badge row">Row {row.rowFromBottom} from bottom · {row.label}</span>
				<span class="badge period">{periodText(book)}</span>
				{#if book.theme}<span class="badge">{book.theme}</span>{/if}
			</div>
			<p class="position">#{index} of {total} in this row</p>
			{#if book.notes}<p class="muted">{book.notes}</p>{/if}
		</div>
	</header>
	<div class="neighbors">
		{@render neighbor('◀ Left of it', prev, 'Start of row')}
		{@render neighbor('Right of it ▶', next, 'End of row')}
	</div>
	<footer><a href="/books/{book.id}">Edit</a></footer>
</article>

<style>
	.card {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1rem;
		background: var(--surface);
		display: grid;
		gap: 1rem;
	}
	header {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}
	h2 {
		margin: 0 0 0.25rem;
		font-size: 1.3rem;
	}
	.where {
		margin: 0 0 0.5rem;
	}
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.badge {
		font-size: 0.9rem;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		background: var(--chip);
	}
	.badge.row {
		background: var(--accent);
		color: var(--on-accent);
	}
	.badge.period {
		background: var(--accent-2);
		color: var(--on-accent);
		font-weight: 600;
	}
	.position {
		margin: 0.5rem 0 0;
		font-weight: 600;
	}
	.neighbors {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.neighbor {
		display: grid;
		gap: 0.2rem;
		align-content: start;
		padding: 0.6rem;
		border-radius: 8px;
		background: var(--chip);
	}
	.neighbor:last-child {
		text-align: right;
		justify-items: end;
	}
	img.large {
		width: 72px;
		border-radius: 4px;
	}
	img.small {
		width: 40px;
		border-radius: 3px;
	}
	footer {
		text-align: right;
		font-size: 0.9rem;
	}
</style>
