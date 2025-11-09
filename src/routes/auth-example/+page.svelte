<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { enhance } from '$app/forms';

	const session = authClient.useSession();

	let signUpForm = $state<{ error?: string; success?: boolean; form?: string } | null>(null);
	let signInForm = $state<{ error?: string; success?: boolean; form?: string } | null>(null);

	function handleSignUp() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			if (result.type === 'failure') {
				signUpForm = result.data;
			} else if (result.type === 'success') {
				signUpForm = result.data;
			}
			await update();
		};
	}

	function handleSignIn() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			if (result.type === 'failure') {
				signInForm = result.data;
			} else if (result.type === 'success') {
				signInForm = result.data;
			}
			await update();
		};
	}
</script>

<div class="max-w-md mx-auto p-6">
	{#if $session.data}
		<div class="bg-green-50 border border-green-200 rounded-lg p-6">
			<h2 class="text-xl font-bold mb-4">
				Welcome, {$session.data.user.name || $session.data.user.email}!
			</h2>
			<p class="text-sm text-gray-600 mb-4">You are signed in.</p>
			<form method="POST" action="?/signOut" use:enhance>
				<button type="submit" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
					Sign Out
				</button>
			</form>
		</div>
	{:else}
		<div class="space-y-6">
			<div>
				<h2 class="text-2xl font-bold mb-4">Sign Up</h2>
				<form method="POST" action="?/signUp" use:enhance={handleSignUp}>
					<div class="space-y-4">
						<div>
							<label for="signup-name" class="block text-sm font-medium mb-1">Name</label>
							<input
								id="signup-name"
								name="name"
								type="text"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded"
							/>
						</div>
						<div>
							<label for="signup-email" class="block text-sm font-medium mb-1">Email</label>
							<input
								id="signup-email"
								name="email"
								type="email"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded"
							/>
						</div>
						<div>
							<label for="signup-password" class="block text-sm font-medium mb-1">Password</label>
							<input
								id="signup-password"
								name="password"
								type="password"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded"
							/>
						</div>
						{#if signUpForm}
							{#if signUpForm.error}
								<div class="bg-red-50 border border-red-200 rounded p-4 text-red-700">
									{signUpForm.error}
								</div>
							{:else if signUpForm.success}
								<div class="bg-green-50 border border-green-200 rounded p-4 text-green-700">
									Sign up successful! Please sign in.
								</div>
							{/if}
						{/if}
						<button
							type="submit"
							class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
						>
							Sign Up
						</button>
					</div>
				</form>
			</div>

			<div>
				<h2 class="text-2xl font-bold mb-4">Sign In</h2>
				<form method="POST" action="?/signIn" use:enhance={handleSignIn}>
					<div class="space-y-4">
						<div>
							<label for="signin-email" class="block text-sm font-medium mb-1">Email</label>
							<input
								id="signin-email"
								name="email"
								type="email"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded"
							/>
						</div>
						<div>
							<label for="signin-password" class="block text-sm font-medium mb-1">Password</label>
							<input
								id="signin-password"
								name="password"
								type="password"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded"
							/>
						</div>
						<div>
							<label class="flex items-center gap-2">
								<input type="checkbox" name="rememberMe" value="true" checked />
								<span class="text-sm">Remember me</span>
							</label>
						</div>
						{#if signInForm?.error}
							<div class="bg-red-50 border border-red-200 rounded p-4 text-red-700">
								{signInForm.error}
							</div>
						{/if}
						<button
							type="submit"
							class="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
						>
							Sign In
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
