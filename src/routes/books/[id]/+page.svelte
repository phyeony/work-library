<script lang="ts">
	import { enhance } from '$app/forms';
	import BookForm from '#lib/components/BookForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let confirming = $state(false);
</script>

<h1>Edit book</h1>

<BookForm
	book={data.book}
	rowId={data.book.rowId}
	place={data.place}
	rows={data.rows}
	periods={data.periods}
	message={form?.message}
	submitLabel="Save"
/>

<form method="POST" action="?/delete" use:enhance class="delete">
	{#if confirming}
		<span>Delete “{data.book.title}”?</span>
		<button class="danger">Yes, delete</button>
		<button type="button" onclick={() => (confirming = false)}>Cancel</button>
	{:else}
		<button type="button" class="danger" onclick={() => (confirming = true)}>Delete book</button>
	{/if}
</form>

<style>
	.delete {
		margin-top: 2rem;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}
</style>
