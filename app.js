const canvas = document.getElementById("scrub-canvas");
const context = canvas.getContext("2d");

const frameCount = 300;
const images = [];
let loadedCount = 0;

// Setup image preloading path helper
const currentFrame = index => {
    // Files are named ezgif-frame-001.jpg to ezgif-frame-300.jpg
    const paddedIndex = String(index).padStart(3, '0');
    return `./ezgif-861934f1fd27dda8-jpg/ezgif-frame-${paddedIndex}.jpg`;
};

// UI Elements for loader
const loader = document.getElementById("loader");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

// Canvas scaling to match cover behavior
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(Math.round(smoothScroll.currentFrame));
}

function renderFrame(index) {
    const imgIndex = Math.max(1, Math.min(frameCount, index));
    const img = images[imgIndex - 1];
    if (!img || !img.complete) return;

    // Calculate aspect ratio covering
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    } else {
        drawWidth = canvas.height * imgRatio;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Variables for smooth scrolling interpolation (lerp)
const smoothScroll = {
    targetFrame: 1,
    currentFrame: 1,
    ease: 0.08 // Lower means smoother/slower catch up
};

function updateScroll() {
    const scrollContainer = document.getElementById("scroll-container");
    const scrollTop = window.scrollY;
    const maxScroll = scrollContainer.scrollHeight - window.innerHeight;
    
    // Convert scroll to 0.0 - 1.0 progress
    const scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
    
    // Map fraction to frames (1 to 300)
    smoothScroll.targetFrame = 1 + scrollFraction * (frameCount - 1);
}

function animate() {
    // Interpolate towards target frame
    const diff = smoothScroll.targetFrame - smoothScroll.currentFrame;
    smoothScroll.currentFrame += diff * smoothScroll.ease;

    // Only render if there is a visible change
    if (Math.abs(diff) > 0.01) {
        renderFrame(Math.round(smoothScroll.currentFrame));
    }

    requestAnimationFrame(animate);
}

// Preload all frames
function preloadImages() {
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            const percent = Math.round((loadedCount / frameCount) * 100);
            progressBar.style.width = `${percent}%`;
            progressText.innerText = `${percent}% loaded`;

            if (loadedCount === frameCount) {
                // Initialize canvas & hide loader
                setTimeout(() => {
                    loader.style.opacity = 0;
                    loader.style.visibility = "hidden";
                    
                    // Trigger initial size and drawing
                    resizeCanvas();
                    // Start rendering loop
                    requestAnimationFrame(animate);
                }, 400); // Small delay to let final transitions feel clean
            }
        };
        img.src = currentFrame(i);
        images.push(img);
    }
}

// Event Listeners
window.addEventListener("scroll", updateScroll);
window.addEventListener("resize", resizeCanvas);

// Kick off
preloadImages();
