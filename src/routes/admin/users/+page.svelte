<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<h1>Allowed users</h1>
<p class="muted">Only these Google accounts can sign in. Only super users can change this list.</p>

{#if form?.message}<p class="error">{form.message}</p>{/if}

<form method="POST" action="?/add" use:enhance class="add">
	<input name="email" type="email" placeholder="someone@gmail.com" required />
	<button class="primary">Add</button>
</form>

<ul>
	{#each data.users as user (user.email)}
		<li>
			<span>
				{user.email}
				{#if data.superUsers.includes(user.email)}<span class="badge">super user</span>{/if}
			</span>
			{#if !data.superUsers.includes(user.email)}
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="email" value={user.email} />
					<button class="danger">Remove</button>
				</form>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.add {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
		margin-bottom: 1rem;
	}
	.add input[type='email'] {
		flex: 1;
		min-width: 12rem;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding: 0.6rem 0;
		border-top: 1px solid var(--border);
	}
	li form {
		display: flex;
		gap: 0.4rem;
	}
	.badge {
		font-size: 0.75rem;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--on-accent);
	}
	.error {
		color: var(--danger);
	}
</style>
