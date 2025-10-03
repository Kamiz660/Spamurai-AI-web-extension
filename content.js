//gets title 
setTimeout(() => {
  const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent.trim();
  console.log('Video title:', videoTitle);
}, 2000);

// Keep track of seen comments 
const seenComments = new Set();

// gets comment text, likes count, replies count
function parseFirstNComments(limit = 20) {
    const threads = Array.from(document.querySelectorAll('ytd-comment-thread-renderer')).slice(0, limit);

    const newComments = threads.map(thread => {
        const commentEl = thread.querySelector('#content-text');
        const text = commentEl ? commentEl.textContent.trim() : null;

        if (!text || seenComments.has(text)) return null; 

        const likeEl = thread.querySelector('#vote-count-middle');
        const likeCount = likeEl ? parseInt(likeEl.textContent.replace(/\D/g, '')) || 0 : 0;

        const replies = thread.querySelectorAll('ytd-comment-replies-renderer ytd-comment-renderer').length;
      
        seenComments.add(text);

        return { text, likeCount, replies };
    }).filter(c => c !== null);

    if (newComments.length) {
        console.log('New comments extracted:', newComments);
    }

    return newComments;
}

// MutationObserver to watch comments
function observeComments() {
    const commentSection = document.querySelector('ytd-item-section-renderer#sections');

    if (!commentSection) {
        console.log('Comment section not loaded yet, retrying...');
        setTimeout(observeComments, 3000);//works with 2 sec but 3 sec is safer for slow internet
        return;
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                parseFirstNComments(10); // parse only when new nodes appear
            }
        }
    });

    observer.observe(commentSection, { childList: true, subtree: true });
    console.log('MutationObserver set up on comments');
}

observeComments();
