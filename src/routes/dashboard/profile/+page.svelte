<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData } from './$types';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { updateProfileSchema, changePasswordSchema } from './schema';

	let { data }: { data: PageData } = $props();

	const updateProfileForm = superForm(data.updateProfileForm, {
		validators: zod4Client(updateProfileSchema)
	});

	const changePasswordForm = superForm(data.changePasswordForm, {
		validators: zod4Client(changePasswordSchema),
		resetForm: true
	});

	const { form: profileData, enhance: profileEnhance } = updateProfileForm;
	const { form: passwordData, enhance: passwordEnhance } = changePasswordForm;
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Update Profile</Card.Title>
			<Card.Description>Update your name and email address</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/updateProfile" use:profileEnhance class="space-y-4">
				<Form.Field form={$profileData} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Name</Form.Label>
							<Input {...props} type="text" bind:value={$profileData.name} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={$profileData} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input {...props} type="email" bind:value={$profileData.email} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button type="submit">Update Profile</Form.Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Change Password</Card.Title>
			<Card.Description>Update your password</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/changePassword" use:passwordEnhance class="space-y-4">
				<Form.Field form={$passwordData} name="currentPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Current Password</Form.Label>
							<Input {...props} type="password" bind:value={$passwordData.currentPassword} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={$passwordData} name="newPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>New Password</Form.Label>
							<Input {...props} type="password" bind:value={$passwordData.newPassword} />
						{/snippet}
					</Form.Control>
					<Form.Description>Must be at least 6 characters</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={$passwordData} name="confirmPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Confirm Password</Form.Label>
							<Input {...props} type="password" bind:value={$passwordData.confirmPassword} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button type="submit">Change Password</Form.Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
