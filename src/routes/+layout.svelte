<script>
	import '../app.css';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

	// Transição suave entre páginas via View Transitions API
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{@render children()}

<style>
	/* Transição rápida e suave de cross-fade */
	:global(::view-transition-old(root)) {
		animation: 120ms ease-out both fadeSlideOut;
	}
	:global(::view-transition-new(root)) {
		animation: 180ms ease-out 60ms both fadeSlideIn;
	}

	@keyframes fadeSlideOut {
		to {
			opacity: 0;
			transform: translateY(-8px);
		}
	}
	@keyframes fadeSlideIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
</style>
