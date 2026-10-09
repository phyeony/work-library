<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const messages: Record<string, string> = {
		denied: 'is not on the allowed list. Ask an admin to add it.',
		unverified: 'Your Google email is not verified.',
		invalid: 'Login failed. Please try again.',
		config: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
	};
</script>

<div class="login">
	<h1>📚 Work Library</h1>
	<p class="muted">Find where each book goes on the shelf.</p>
	{#if data.signedOut}
		<p>You've signed out.</p>
	{/if}
	{#if data.error}
		<p class="error">
			{#if data.error === 'denied'}<strong>{data.email}</strong>{/if}
			{messages[data.error] ?? messages.invalid}
		</p>
	{/if}
	<a class="button primary" href="/login/google" data-sveltekit-reload>Sign in with Google</a>
</div>

<style>
	.login {
		display: grid;
		gap: 0.75rem;
		justify-items: center;
		text-align: center;
		margin-top: 20vh;
	}
	.error {
		color: var(--danger);
	}
</style>
