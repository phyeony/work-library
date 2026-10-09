<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		book: {
			title: string;
			periodLabel: string;
			week: number | null;
			theme: string | null;
			notes: string | null;
		};
		rowId: number;
		place: number;
		rows: { id: number; label: string; rowFromBottom: number; shelf: string }[];
		periods: string[];
		message?: string;
		submitLabel: string;
	}

	let { book, rowId, place, rows, periods, message, submitLabel }: Props = $props();
</script>

<form method="POST" action="?/save" use:enhance class="stack">
	{#if message}<p class="error">{message}</p>{/if}
	<label>
		Title
		<input name="title" value={book.title} required />
	</label>
	<label>
		Row
		<select name="rowId" value={rowId}>
			{#each rows as row (row.id)}
				<option value={row.id}>{row.shelf} — Row {row.rowFromBottom}: {row.label}</option>
			{/each}
		</select>
	</label>
	<div class="grid">
		<label>
			Position in row (#)
			<input name="place" type="number" min="1" value={place} required />
		</label>
		<label>
			Month / section
			<input name="periodLabel" value={book.periodLabel} list="periods" required />
		</label>
		<label>
			Week
			<input name="week" type="number" min="1" max="6" value={book.week ?? ''} />
		</label>
	</div>
	<datalist id="periods">
		{#each periods as p (p)}<option value={p}></option>{/each}
	</datalist>
	<label>
		Theme
		<input name="theme" value={book.theme ?? ''} />
	</label>
	<label>
		Notes
		<textarea name="notes" rows="2">{book.notes ?? ''}</textarea>
	</label>
	<button class="primary">{submitLabel}</button>
</form>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 0.75rem;
	}
	.error {
		color: var(--danger);
	}
</style>
