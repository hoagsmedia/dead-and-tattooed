<script lang="ts">
	import { Instagram } from '@lucide/svelte';
	import NotifyForm from './Notify-Form.svelte';

	const year = new Date().getFullYear();
</script>

<footer class="mt-16 border-t border-border/70">
	<div
		class="container mx-auto flex flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between"
	>
		<div class="max-w-sm space-y-2">
			<p class="font-display text-lg tracking-wide uppercase">
				Dead <span class="text-neon-teal">&amp;</span> Tattooed
			</p>
			<p class="text-sm text-muted-foreground">
				Hand-tattooed, preserved specimens — made one at a time by a tattoo artist who takes dead
				things very seriously.
			</p>
			<p class="text-xs text-muted-foreground/80">
				&copy; {year} Dead &amp; Tattooed. Real ink. Real preservation. Real weird.
			</p>
			<div class="pt-2">
				<NotifyForm heading="New drops, no spam" />
			</div>
		</div>

		<nav class="flex gap-12 text-sm" aria-label="Footer">
			<div class="space-y-2">
				<p class="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Shop</p>
				<ul class="space-y-1.5">
					<li>
						<a
							href="/products"
							class="text-muted-foreground transition-colors hover:text-neon-teal"
						>
							Gallery
						</a>
					</li>
					<li>
						<a href="/cart" class="text-muted-foreground transition-colors hover:text-neon-teal">
							Cart
						</a>
					</li>
				</ul>
			</div>
			<div class="space-y-2">
				<p class="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Help</p>
				<ul class="space-y-1.5">
					<li>
						<a
							href="/info#shipping"
							class="text-muted-foreground transition-colors hover:text-neon-teal"
						>
							Shipping
						</a>
					</li>
					<li>
						<a
							href="/info#returns"
							class="text-muted-foreground transition-colors hover:text-neon-teal"
						>
							Returns
						</a>
					</li>
					<li>
						<a
							href="/info#contact"
							class="text-muted-foreground transition-colors hover:text-neon-teal"
						>
							Contact
						</a>
					</li>
				</ul>
			</div>
			<div class="space-y-2">
				<p class="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Follow</p>
				<ul class="space-y-1.5">
					<li>
						<a
							href="https://www.instagram.com/deadandtattooed/"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-neon-teal"
						>
							<Instagram class="size-4" />
							Instagram
						</a>
					</li>
				</ul>
			</div>
		</nav>
	</div>
</footer>
