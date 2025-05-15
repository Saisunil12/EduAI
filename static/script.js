document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const pdfFileInput = document.getElementById('pdfFile');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const progressMessage = document.getElementById('progressMessage');
    const resultSection = document.getElementById('resultSection');
    const podcastPlayer = document.getElementById('podcastPlayer');
    const downloadBtn = document.getElementById('downloadBtn');
    const newPodcastBtn = document.getElementById('newPodcastBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const fileInfoContainer = document.getElementById('fileInfoContainer');
    const removeFileBtn = document.getElementById('removeFileBtn');

    let currentTaskId = null;

    // Drag and drop functionality
    const dropZone = document.querySelector('.border-dashed');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        pdfFileInput.files = files;
        if (files.length > 0) {
            fileNameDisplay.textContent = files[0].name;
            fileInfoContainer.classList.remove('hidden');
        } else {
            fileNameDisplay.textContent = '';
            fileInfoContainer.classList.add('hidden');
        }
    }

    // Show selected file name
    pdfFileInput.addEventListener('change', () => {
        if (pdfFileInput.files.length > 0) {
            fileNameDisplay.textContent = pdfFileInput.files[0].name;
            fileInfoContainer.classList.remove('hidden');
        } else {
            fileNameDisplay.textContent = '';
            fileInfoContainer.classList.add('hidden');
        }
    });

    // Form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = pdfFileInput.files[0];
        if (!file) {
            alert('Please select a PDF file');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('Please upload a PDF file');
            return;
        }

        // Show progress section
        progressSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        progressBar.style.width = '0%';
        progressMessage.textContent = 'Uploading PDF...';

        // Animate progress bar slowly to 20% (uploading)
        await animateProgressBar(0, 20, 400);

        const formData = new FormData();
        formData.append('pdf_file', file);

        try {
            // Upload PDF and create podcast
            const response = await fetch('/create-podcast', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to create podcast');
            }

            const data = await response.json();
            currentTaskId = data.task_id;

            // Start polling for status
            pollStatus();
        } catch (error) {
            console.error('Error:', error);
            progressMessage.textContent = 'Error: ' + error.message;
        }
    });

    // Animate progress bar helper
    async function animateProgressBar(from, to, duration) {
        const start = from;
        const end = to;
        const stepTime = 20;
        const steps = Math.ceil(duration / stepTime);
        let current = start;
        let step = (end - start) / steps;
        for (let i = 0; i < steps; i++) {
            current += step;
            progressBar.style.width = `${current}%`;
            await new Promise(res => setTimeout(res, stepTime));
        }
        progressBar.style.width = `${end}%`;
    }

    // Poll for podcast status
    async function pollStatus() {
        if (!currentTaskId) return;

        try {
            const response = await fetch(`/podcast_status/${currentTaskId}`);
            const data = await response.json();

            // Simulate smoother progress bar
            let targetProgress = 0;
            if (data.progress) {
                targetProgress = Math.floor(data.progress * 100);
            }
            const currentWidth = parseFloat(progressBar.style.width) || 0;
            if (targetProgress > currentWidth) {
                // Animate progress bar more slowly
                await animateProgressBar(currentWidth, targetProgress, 600);
            }
            progressMessage.textContent = data.message;

            if (data.status === 'completed') {
                await animateProgressBar(parseFloat(progressBar.style.width) || 0, 100, 800);
                // Show result section
                progressSection.classList.add('hidden');
                resultSection.classList.remove('hidden');

                // Set up audio player
                const audioUrl = `/get_podcast/${currentTaskId}`;
                podcastPlayer.src = audioUrl;

                // Set up download button
                downloadBtn.onclick = () => {
                    window.location.href = audioUrl;
                };
            } else if (data.status === 'failed') {
                progressMessage.textContent = 'Error: ' + data.message;
            } else {
                // Continue polling
                setTimeout(pollStatus, 1000);
            }
        } catch (error) {
            console.error('Error polling status:', error);
            progressMessage.textContent = 'Error checking status';
        }
    }

    // Remove file button
    removeFileBtn.addEventListener('click', () => {
        pdfFileInput.value = '';
        fileNameDisplay.textContent = '';
        fileInfoContainer.classList.add('hidden');
    });

    // New podcast button
    newPodcastBtn.addEventListener('click', () => {
        // Reset form
        uploadForm.reset();
        resultSection.classList.add('hidden');
        progressSection.classList.add('hidden');
        currentTaskId = null;
        fileNameDisplay.textContent = '';
        fileInfoContainer.classList.add('hidden');
    });
}); 