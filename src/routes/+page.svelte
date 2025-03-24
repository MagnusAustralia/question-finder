<script lang="ts">
	import Questions from '../lib/components/Questions.svelte';
	import RandomQuestions from '../lib/components/RandomQuestions.svelte';

	let displayOption: number;
	$: displayOption = 0;
</script>

<div class="flex min-h-screen flex-col items-center justify-center space-y-5">
	<div class="flex flex-row gap-x-5">
		<button
			class="w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
			aria-label="List all questions"
			on:click={() => {
				if (displayOption != 1) {
					displayOption = 1;
				} else {
					displayOption = 0;
				}
				console.log(displayOption);
			}}>List all questions</button
		>
		<button
			class="w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
			aria-label="Filter Questions"
			on:click={() => {
				if (displayOption != 2) {
					displayOption = 2;
				} else {
					displayOption = 0;
				}
				console.log(displayOption);
			}}>Filter Questions</button
		>
	</div>

	{#if displayOption === 1}
		<Questions />
	{:else if displayOption === 2}
		<RandomQuestions />
	{/if}
</div>
