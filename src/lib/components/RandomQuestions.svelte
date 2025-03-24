<script lang="ts">
	import { onMount } from 'svelte';

	let year: string = '';
	let subject: string = '';
	let topic: string = '';
	let paper: string = '';
	let min_points: number = 0;
	let limit: number | null = null; // Use null instead of 10 for no limit

	let questions: any[] = [];

	const BACKEND_IP = import.meta.env.VITE_BACKEND_IP; // Use the environment variable

	// Fetch random questions based on the selected filters
	const fetchRandomQuestions = async () => {
		try {
			const params = new URLSearchParams();

			// Add filters to query parameters
			if (year) params.append('year', year);
			if (subject) params.append('subject', subject);
			if (topic) params.append('topic', topic);
			if (min_points) params.append('min_points', min_points.toString());
			if (limit !== null) params.append('limit', limit.toString());

			const res = await fetch(`${BACKEND_IP}/random-questions?${params.toString()}`);
			if (res.ok) {
				questions = await res.json();
			} else {
				console.error('Failed to fetch random questions');
			}
		} catch (error) {
			console.error('Error fetching random questions:', error);
		}
	};

	// On mount, fetch questions with default filters
	onMount(() => {
		fetchRandomQuestions();
	});
</script>

<main>
	<h1>Random Questions</h1>

	<div>
		<label for="year">Year:</label>
		<input type="text" id="year" bind:value={year} />

		<label for="subject">Subject:</label>
		<select id="subject" bind:value={subject}>
			<option value="">Select Subject</option>
			<option value="Mathematics">Mathematics</option>
			<option value="Further Mathematics">Further Mathematics</option>
			<option value="Physics">Physics</option>
			<option value="Computer Science">Computer Science</option>
		</select>

		<label for="topic">Topic:</label>
		<select id="topic" bind:value={topic}>
			<option value="">Select Topic</option>
			{#if subject === 'Mathematics'}
				<option value="Proof">Proof</option>
				<option value="Algebra and Functions">Algebra and Functions</option>
				<option value="Coordinate Geometry">Coordinate Geometry</option>
				<option value="Sequence and Series">Sequence and Series</option>
				<option value="Trigonometry">Trigonometry</option>
				<option value="Exponentials and Logorithms">Exponentials and Logorithms</option>
				<option value="Differentiation">Differentiation</option>
				<option value="Integration">Integration</option>
				<option value="Numerical Methods">Numerical Methods</option>
				<option value="Vectors">Vectors</option>
			{/if}
		</select>

		<label for="paper">Paper:</label>
		<select id="paper" bind:value={paper}>
			<option value="">Select Paper</option>
			<option value="Paper 1">Paper 1</option>
			<option value="Paper 2">Paper 2</option>
		</select>

		<label for="min_points">Min Points:</label>
		<input type="number" id="min_points" bind:value={min_points} />

		<label for="limit">Limit:</label>
		<select id="limit" bind:value={limit}>
			<option value="">None (Select All)</option>
			<option value="10">10</option>
			<option value="20">20</option>
			<option value="50">50</option>
			<option value="100">100</option>
		</select>

		<!-- Find Questions Button -->
		<button on:click={fetchRandomQuestions}>Find Questions</button>
	</div>

	<div>
		<h2>Questions</h2>
		{#if questions.length > 0}
			<ul>
				{#each questions as question}
					<li>
						<strong>{question.subject}</strong> - {question.topic} - {question.year_of_paper} - {question.points_available}
						points
					</li>
				{/each}
			</ul>
		{:else}
			<p>No questions available</p>
		{/if}
	</div>
</main>
