<script lang="ts">
	import { enhance } from '$app/forms';
	import { periodText } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let editing = $state(false);

	/** Groups a row's books by month/section, keeping shelf order. */
	function groups<T extends { periodLabel: string }>(books: T[]) {
		const out: { period: string; books: T[] }[] = [];
		for (const b of books) {
			const last = out.at(-1);
			if (last?.period === b.periodLabel) last.books.push(b);
			else out.push({ period: b.periodLabel, books: [b] });
		}
		return out;
	}
</script>

<header class="head">
	{#if editing}
		<form method="POST" action="?/renameShelf" use:enhance={() => async ({ update }) => { await update(); editing = false; }}>
			<input name="name" value={data.shelf.name} />
			<button class="primary">Save</button>
		</form>
	{:else}
		<h1>{data.shelf.name}</h1>
		<button onclick={() => (editing = true)}>Rename</button>
	{/if}
</header>
<p class="muted">Rows are shown top to bottom, as they stand on the bookcase. Books run left to right.</p>

<div class="stack">
	{#each [...data.rows].reverse() as row (row.id)}
		<details class="row" open={data.rows.length === 1}>
			<summary>
				<span class="muted">Row {row.rowFromBottom}</span>
				<strong>{row.label}</strong>
				<span class="muted">· {row.books.length} books</span>
			</summary>
			<div class="actions">
				<a class="button" href="/rows/{row.id}/link">🔗 Link barcodes</a>
				<a class="button" href="/books/new?row={row.id}">＋ Add book</a>
				<form method="POST" action="?/renameRow" use:enhance class="rename">
					<input type="hidden" name="rowId" value={row.id} />
					<input name="label" value={row.label} aria-label="Row label" />
					<button>Rename</button>
				</form>
			</div>
			{#each groups(row.books) as group (group.period + group.books[0].id)}
				<h3>{group.period}</h3>
				<ol>
					{#each group.books as book (book.id)}
						<li value={row.books.indexOf(book) + 1}>
							<a href="/books/{book.id}">{book.title}</a>
							<span class="muted">{periodText(book)}{book.theme ? ` · ${book.theme}` : ''}</span>
							{#if book.linked}<span title="Barcode linked">🔗</span>{/if}
						</li>
					{/each}
				</ol>
			{/each}
		</details>
	{/each}
</div>

<style>
	.head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.head h1 {
		margin: 0;
	}
	.head form {
		display: flex;
		gap: 0.5rem;
		flex: 1;
	}
	.head input {
		flex: 1;
	}
	.row {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.75rem 1rem;
	}
	summary {
		cursor: pointer;
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		font-size: 1.05rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0.75rem 0;
	}
	.rename {
		display: flex;
		gap: 0.4rem;
	}
	.rename input {
		width: 10rem;
	}
	h3 {
		margin: 0.75rem 0 0.25rem;
		font-size: 0.95rem;
		color: var(--accent-2);
	}
	ol {
		margin: 0;
		padding-left: 2.2rem;
	}
	li {
		padding: 0.15rem 0;
	}
	li .muted {
		font-size: 0.85rem;
		margin-left: 0.35rem;
	}
</style>
