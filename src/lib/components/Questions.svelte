<script lang="ts">
	import { onMount } from 'svelte';

	interface Question {
		id: number;
		year_of_paper: string;
		subject: string;
		topic: string;
		points_available: number;
		time_available: number;
		question_number: number;
	}

	let questions: Question[] = [];
	let error: string | null = null;

	// Fetch questions when the component mounts
	onMount(async () => {
		try {
			const res = await fetch('http://localhost:3000/questions');
			if (res.ok) {
				// Type assertion as we expect the response to be a list of questions
				questions = (await res.json()) as Question[];
			} else {
				throw new Error('Failed to fetch questions');
			}
		} catch (err: any) {
			error = err.message;
		}
	});

	// Function to fetch image as base64
	const getImageBase64 = async (questionId: number): Promise<string> => {
		try {
			const res = await fetch(`http://localhost:3000/question/${questionId}/image`);
			if (!res.ok) {
				throw new Error('Failed to fetch image');
			}
			const data = await res.json();

			// Just return the base64 string from the response without adding the prefix
			return data.image; // This will already be in the correct format: data:image/jpeg;base64,...
		} catch (err: any) {
			console.error('Failed to fetch image:', err);
			return ''; // Return empty string in case of error
		}
	};
</script>

<main>
	<h1>Questions List</h1>

	{#if error}
		<p style="color: red;">{error}</p>
	{/if}

	{#if questions.length > 0}
		<ul>
			{#each questions as question (question.id)}
				<li>
					<strong>Year:</strong>
					{question.year_of_paper} <br />
					<strong>Subject:</strong>
					{question.subject} <br />
					<strong>Topic:</strong>
					{question.topic} <br />
					<strong>Points Available:</strong>
					{question.points_available} <br />
					<strong>Time Available:</strong>
					{question.time_available} seconds <br />
					<strong>Question Number:</strong>
					{question.question_number}<br />
					<br />

					<!-- Fetch image as base64 and display -->
					{#await getImageBase64(question.id) then imageBase64}
						{#if imageBase64}
							<img src={imageBase64} alt="Question" width="1000px" />
						{:else}
							<p>Loading image...</p>
							<!-- Show loading message for the image -->
						{/if}
					{/await}
				</li>
				<br />
			{/each}
		</ul>
	{:else}
		<p>Loading questions...</p>
	{/if}
</main>
