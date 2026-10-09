<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const links = $derived([
		{ href: '/', label: 'Find' },
		{ href: '/shelves', label: 'Shelves' },
		...(data.user?.isAdmin ? [{ href: '/admin/users', label: 'Users' }] : [])
	]);
	const active = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Work Library</title>
</svelte:head>

{#if data.user}
	<nav>
		<strong>📚</strong>
		{#each links as link (link.href)}
			<a href={link.href} class:active={active(link.href)}>{link.label}</a>
		{/each}
		<form method="POST" action="/logout">
			<button title={data.user.email}>Log out</button>
		</form>
	</nav>
{/if}

<main>
	{@render children()}
</main>

<style>
	nav {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: calc(env(safe-area-inset-top, 0px) + 0.5rem) 1rem 0.5rem;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}
	nav a {
		padding: 0.4rem 0.7rem;
		border-radius: 8px;
		text-decoration: none;
		color: var(--text);
	}
	nav a.active {
		background: var(--chip);
		font-weight: 600;
	}
	nav form {
		margin-left: auto;
	}
	nav button {
		font-size: 0.85rem;
		padding: 0.35rem 0.6rem;
	}
	main {
		max-width: 46rem;
		margin: 0 auto;
		padding: 1rem 1rem calc(env(safe-area-inset-bottom, 0px) + 2rem);
	}
</style>
