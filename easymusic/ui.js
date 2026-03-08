function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// 绑定按钮事件

document.getElementById('settings-btn').addEventListener('click', () => {
    showModal('settings-modal');
});

document.getElementById('tools-btn').addEventListener('click', () => {
    showModal('tools-modal');
});

document.getElementById('lyric-search-btn').addEventListener('click', () => {
    showModal('lyric-search-modal');
});

document.getElementById('help-btn').addEventListener('click', () => {
    showModal('help-modal');
});

document.getElementById('about-btn').addEventListener('click', () => {
    showModal('about-modal');
});

document.getElementById('api-btn').addEventListener('click', () => {
    showModal('api-modal');
});

document.getElementById('search-btn').addEventListener('click', () => {
    search_insert_to_list_id = -1;
    showModal('song-search-overlay');
});

document.getElementById('new-playlist-btn').addEventListener('click', () => {
    showModal('new-playlist-overlay');
});

// 绑定关闭事件

document.getElementById('settings-close').addEventListener('click', () => {
    hideModal('settings-modal');
});

document.getElementById('tools-close').addEventListener('click', () => {
    hideModal('tools-modal');
});

document.getElementById('lyric-search-close').addEventListener('click', () => {
    hideModal('lyric-search-modal');
});

document.getElementById('help-close').addEventListener('click', () => {
    hideModal('help-modal');
});

document.getElementById('about-close').addEventListener('click', () => {
    hideModal('about-modal');
});

document.getElementById('api-close').addEventListener('click', () => {
    hideModal('api-modal');
});

document.getElementById('song-search-close').addEventListener('click', () => {
    hideModal('song-search-overlay');
});

document.getElementById('new-playlist-close').addEventListener('click', () => {
    hideModal('new-playlist-overlay');
});

document.getElementById('alart-close').addEventListener('click', () => {
    hideModal('alart-modal');
});

document.getElementById('add-to-playlist-close').addEventListener('click', () => {
    hideModal('add-to-playlist-overlay');
});

document.getElementById("")

// 按下Esc键关闭所有模态框

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideModal('settings-modal');
        hideModal('tools-modal');
        hideModal('lyric-search-modal');
        hideModal('help-modal');
        hideModal('about-modal');
        hideModal('api-modal');
        hideModal('song-search-overlay');
        hideModal('new-playlist-overlay');
        hideModal('alart-modal');
        hideModal('add-to-playlist-overlay');
    }
});

// 歌词面板切换
document.getElementById('lyric-toggle-btn').addEventListener('click', () => {
    const lyricLines = document.querySelectorAll('.lyric-line');
    lyricLines.forEach(line => {
        line.classList.toggle('show');
    });
    document.getElementById('lyric-toggle-btn').querySelector('i').classList.toggle('bi-chevron-up');
    document.getElementById('lyric-toggle-btn').querySelector('i').classList.toggle('bi-chevron-down');
});

// 当前时间和空间占用显示
async function updateTimeAndStorage() {
    const now = new Date();
    const timeString = now.toLocaleTimeString().substring(0, 5);
    document.getElementById('time').innerText = timeString;
    document.getElementById('space').innerText = await DBgetUsedSize();
}

setInterval(updateTimeAndStorage, 2000);
updateTimeAndStorage();