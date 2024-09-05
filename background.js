chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'playVideo') {
        const videoId = new URL(request.url).searchParams.get('v');
        if (videoId) {
            chrome.tabs.create({ url: `https://www.youtube.com/watch?v=${videoId}` });
        } else {
            console.error('Invalid YouTube URL');
        }
    }
});
