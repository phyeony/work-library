<script lang="ts">
	import Fuse from 'fuse.js';
	import Scanner from '#lib/components/Scanner.svelte';
	import { periodText } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Book = (typeof data.books)[number];
	type Notice =
		| { kind: 'linked'; book: Book; isbn: string; hint: string | null; mismatch: boolean }
		| { kind: 'conflict'; isbn: string; otherTitle: string }
		| { kind: 'error'; message: string };

	// svelte-ignore state_referenced_locally
	let linkedKeys = $state(new Set(data.books.filter((b) => b.isbns.length).map((b) => b.titleKey)));
	let busy = $state(false);
	let notice = $state<Notice | null>(null);
	let history = $state<{ isbn: string; cursor: number; key: string; keyWasLinked: boolean }[]>([]);

	const isLinked = (b: Book) => linkedKeys.has(b.titleKey);
	const linkedCount = $derived(data.books.filter(isLinked).length);

	function nextUnlinked(from: number) {
		const i = data.books.findIndex((b, j) => j >= from && !linkedKeys.has(b.titleKey));
		return i === -1 ? data.books.length : i;
	}

	let cursor = $state(nextUnlinked(0));
	const target = $derived(data.books[cursor] as Book | undefined);

	function looksDifferent(hint: string | null, title: string) {
		if (!hint) return false;
		return new Fuse([title], { threshold: 0.5, ignoreLocation: true }).search(hint).length === 0;
	}

	async function api(url: string, init?: RequestInit) {
		const res = await fetch(url, {
			...init,
			headers: init?.body ? { 'content-type': 'application/json' } : undefined
		});
		if (!res.ok) throw new Error((await res.text()) || res.statusText);
		return res.json();
	}

	async function link(isbn: string, book: Book, hint: string | null) {
		await api('/api/links', { method: 'POST', body: JSON.stringify({ isbn, titleKey: book.titleKey }) });
		history = [...history, { isbn, cursor, key: book.titleKey, keyWasLinked: linkedKeys.has(book.titleKey) }];
		linkedKeys = new Set([...linkedKeys, book.titleKey]);
		notice = { kind: 'linked', book, isbn, hint, mismatch: looksDifferent(hint, book.title) };
		cursor = nextUnlinked(cursor + 1);
	}

	async function onScan(code: string) {
		if (!target || busy) return;
		busy = true;
		try {
			const r = await api(`/api/isbn/${encodeURIComponent(code)}?nolink`);
			if (r.titleKey === target.titleKey) {
				cursor = nextUnlinked(cursor + 1);
				notice = { kind: 'linked', book: target, isbn: r.isbn, hint: null, mismatch: false };
			} else if (r.titleKey) {
				const other = r.locations[0]?.book.title ?? r.titleKey;
				notice = { kind: 'conflict', isbn: r.isbn, otherTitle: other };
			} else {
				await link(r.isbn, target, r.hint);
			}
		} catch (e) {
			notice = { kind: 'error', message: e instanceof Error ? e.message : String(e) };
		} finally {
			busy = false;
		}
	}

	async function relink(isbn: string) {
		if (!target) return;
		busy = true;
		try {
			await link(isbn, target, null);
		} finally {
			busy = false;
		}
	}

	async function undo() {
		const last = history.at(-1);
		if (!last) return;
		await api('/api/links', { method: 'DELETE', body: JSON.stringify({ isbn: last.isbn }) });
		history = history.slice(0, -1);
		if (!last.keyWasLinked) {
			const keys = new Set(linkedKeys);
			keys.delete(last.key);
			linkedKeys = keys;
		}
		cursor = last.cursor;
		notice = null;
	}

	function skip() {
		notice = null;
		cursor = nextUnlinked(cursor + 1);
	}
</script>

<h1>Link barcodes</h1>
<p class="muted">
	<a href="/shelves/{data.shelf.id}">{data.shelf.name}</a> · Row {data.row.rowFromBottom}: {data.row.label}
</p>

<div class="progress" aria-label="Linked">
	<div style:width="{(linkedCount / Math.max(data.books.length, 1)) * 100}%"></div>
	<span>{linkedCount} / {data.books.length} linked</span>
</div>

<div class="stack">
	{#if target}
		<Scanner ondetect={onScan} paused={busy || notice?.kind === 'conflict'} />
		<div class="target">
			<small>Scan this book (#{cursor + 1})</small>
			<strong>{target.title}</strong>
			<span class="muted">{periodText(target)}</span>
			<div class="buttons">
				<button onclick={skip}>Skip</button>
				<button onclick={undo} disabled={!history.length}>Undo last</button>
			</div>
		</div>
	{:else}
		<p class="done">🎉 Every book in this row is linked.</p>
		<button onclick={undo} disabled={!history.length}>Undo last</button>
	{/if}

	{#if notice?.kind === 'linked'}
		<p class="notice" class:warn={notice.mismatch}>
			✓ Linked <strong>{notice.book.title}</strong>
			{#if notice.mismatch}
				<br />⚠️ Book databases call this barcode “{notice.hint}”. Wrong book?
				<button onclick={undo}>Undo</button>
			{/if}
		</p>
	{:else if notice?.kind === 'conflict'}
		<div class="notice warn">
			This barcode is already linked to <strong>{notice.otherTitle}</strong>.
			<div class="buttons">
				<button onclick={() => notice?.kind === 'conflict' && relink(notice.isbn)}>
					Link to “{target?.title}” instead
				</button>
				<button onclick={() => (notice = null)}>Keep, scan again</button>
			</div>
		</div>
	{:else if notice?.kind === 'error'}
		<p class="notice warn">{notice.message}</p>
	{/if}
</div>

<ol class="list">
	{#each data.books as book, i (book.id)}
		<li class:current={i === cursor} class:linked={isLinked(book)}>
			<button
				onclick={() => {
					cursor = i;
					notice = null;
				}}
			>
				<span class="mark">{isLinked(book) ? '✓' : '○'}</span>
				<span>{book.title}</span>
				<span class="muted">{periodText(book)}</span>
			</button>
		</li>
	{/each}
</ol>

<style>
	.progress {
		position: relative;
		height: 1.6rem;
		border-radius: 999px;
		background: var(--chip);
		overflow: hidden;
		margin-bottom: 1rem;
	}
	.progress div {
		height: 100%;
		background: var(--ok);
		transition: width 0.3s;
	}
	.progress span {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.target {
		display: grid;
		gap: 0.2rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius);
		background: var(--surface);
		border: 2px solid var(--accent);
	}
	.target strong {
		font-size: 1.2rem;
	}
	.buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 0.4rem;
	}
	.notice {
		margin: 0;
		padding: 0.6rem 0.8rem;
		border-radius: 8px;
		background: color-mix(in srgb, var(--ok) 15%, transparent);
	}
	.notice.warn {
		background: color-mix(in srgb, var(--accent-2) 18%, transparent);
	}
	.done {
		font-size: 1.2rem;
		text-align: center;
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0 0;
	}
	.list button {
		width: 100%;
		display: grid;
		grid-template-columns: 1.5rem 1fr auto;
		gap: 0.5rem;
		text-align: left;
		border: 0;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		background: transparent;
	}
	.list .linked .mark {
		color: var(--ok);
	}
	.list .current button {
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		font-weight: 600;
	}
	.list .muted {
		font-size: 0.85rem;
	}
</style>
