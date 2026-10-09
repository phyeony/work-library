<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Shelves</h1>

<div class="stack">
	{#each data.shelves as shelf (shelf.id)}
		<section class="shelf">
			<h2><a href="/shelves/{shelf.id}">{shelf.name}</a></h2>
			<ul>
				{#each [...shelf.rows].reverse() as row (row.id)}
					<li>
						<span>
							<span class="muted">Row {row.rowFromBottom}</span>
							{row.label}
						</span>
						<span class="muted">{row.count} books</span>
						<a class="link" href="/rows/{row.id}/link">
							🔗 {row.linked}/{row.count}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.shelf {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1rem;
	}
	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.15rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.45rem 0;
		border-top: 1px solid var(--border);
	}
	.link {
		font-size: 0.9rem;
		text-decoration: none;
	}
</style>
