<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { signInSchema, type SignInSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data }: { data: { signInForm: SuperValidated<Infer<SignInSchema>> } } = $props();

	const form = superForm(data.signInForm, {
		validators: zod4Client(signInSchema)
	});

	const { form: formData, enhance } = form;
</script>

<form method="POST" action="?/signIn" use:enhance>
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} type="email" bind:value={$formData.email} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Password</Form.Label>
				<Input {...props} type="password" bind:value={$formData.password} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="rememberMe">
		<Form.Control>
			{#snippet children({ props })}
				<div class="flex items-center space-x-2">
					<Checkbox {...props} bind:checked={$formData.rememberMe} id="rememberMe" />
					<Form.Label for="rememberMe" class="mt-0! cursor-pointer">Remember me</Form.Label>
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button>Sign In</Form.Button>
</form>
