<script lang="ts">
	import BookForm from '#lib/components/BookForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<h1>Add book</h1>

<BookForm
	book={{ title: '', periodLabel: data.defaults.periodLabel, week: data.defaults.week, theme: null, notes: null }}
	rowId={data.rowId}
	place={data.place}
	rows={data.rows}
	periods={data.periods}
	message={form?.message}
	submitLabel="Add book"
/>
