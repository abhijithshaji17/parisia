const canvas = document.getElementById("scrub-canvas");
const context = canvas.getContext("2d");

const frameCount = 300;
const images = new Array(frameCount).fill(null);
let loadedCount = 0;
let loaderDismissed = false;

// Setup image preloading path helper
const currentFrame = index => {
    const paddedIndex = String(index).padStart(3, '0');
    return `./assets_img/ezgif-frame-${paddedIndex}.jpg`;
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
    let img = images[imgIndex - 1];

    // If target image is not loaded yet, find nearest loaded frame
    if (!img || !img.complete || img.naturalWidth === 0) {
        for (let offset = 1; offset < frameCount; offset++) {
            const prev = images[imgIndex - 1 - offset];
            if (prev && prev.complete && prev.naturalWidth > 0) {
                img = prev;
                break;
            }
            const next = images[imgIndex - 1 + offset];
            if (next && next.complete && next.naturalWidth > 0) {
                img = next;
                break;
            }
        }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

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
    ease: 0.08
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
    const diff = smoothScroll.targetFrame - smoothScroll.currentFrame;
    smoothScroll.currentFrame += diff * smoothScroll.ease;

    if (Math.abs(diff) > 0.01) {
        renderFrame(Math.round(smoothScroll.currentFrame));
    }

    requestAnimationFrame(animate);
}

function dismissLoader() {
    if (loaderDismissed || !loader) return;
    loaderDismissed = true;
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";
    setTimeout(() => {
        loader.style.display = "none";
    }, 600);
}

// Progressive image preloader
function preloadImages() {
    // Load frame 1 immediately so user sees content instantly
    const firstImg = new Image();
    firstImg.onload = () => {
        images[0] = firstImg;
        loadedCount++;
        resizeCanvas();
        requestAnimationFrame(animate);

        // Dismiss loader early so user doesn't wait on all 300 frames
        setTimeout(dismissLoader, 300);

        // Load remaining frames in background
        loadRemainingFrames();
    };
    firstImg.onerror = () => {
        dismissLoader();
        loadRemainingFrames();
    };
    firstImg.src = currentFrame(1);
}

function loadRemainingFrames() {
    for (let i = 2; i <= frameCount; i++) {
        const img = new Image();
        const handleLoad = () => {
            loadedCount++;
            images[i - 1] = img;
            const percent = Math.round((loadedCount / frameCount) * 100);
            if (progressBar) progressBar.style.width = `${percent}%`;
            if (progressText) progressText.innerText = `${percent}% loaded`;

            // Auto-dismiss loader if it hasn't dismissed yet
            if (loadedCount >= 10 && !loaderDismissed) {
                dismissLoader();
            }

            renderFrame(Math.round(smoothScroll.currentFrame));
        };
        img.onload = handleLoad;
        img.onerror = handleLoad;
        img.src = currentFrame(i);
    }
}

// Event Listeners
window.addEventListener("scroll", updateScroll);
window.addEventListener("resize", resizeCanvas);

// Kick off
preloadImages();
