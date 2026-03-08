player_status = "idle";
// idle        未加载
// loading     加载中
// playing     播放中
// paused      暂停
// ended       播放结束
// error       出错
loop_mode = "order";
// order       顺序播放
// repeat      单曲循环
// shuffle     随机播放

current_song = null;
current_playlist = null;
current_index = -1;

playlist = null;
now_id = null;
list_mode = false;

audio = new Audio();
audio.preload = "auto";
audio.addEventListener("timeupdate", update_progress);
audio.addEventListener("timeupdate", update_time);
audio.addEventListener("ended", on_song_end);
// audio.addEventListener("error", on_song_error);

lyric = null;

function init_player() {
    update_play_button();
    const progressBar = document.getElementById("player-progress-bar");
    progressBar.value = 0;
    const currentTimeEl = document.getElementById("player-time");
    const durationEl = document.getElementById("player-duration");
    currentTimeEl.innerText = "00:00";
    durationEl.innerText = "00:00";
    document.getElementById("lyric-1").innerText = "";
    document.getElementById("lyric-2").innerText = "暂无歌词";
    document.getElementById("lyric-3").innerText = "";
}

init_player();

function update_play_button() {
    const playBtn = document.getElementById("player-ctl-btn");
    if (player_status === "playing") {
        playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
    } else {
        playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
    }
}

function parseLyric(input) {
    // 允许传入字符串或 { lyric: "xxx" }
    let lyric = typeof input === "string" ? input : input?.lyric;
    if (!lyric || typeof lyric !== "string") {
        console.warn("parseLyric: 无效歌词数据", input);
        return [];
    }
    const lines = lyric.split("\n");
    const lyricData = [];
    for (const line of lines) {
        // 匹配所有时间标签
        const matches = line.matchAll(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/g);
        // 去除所有时间标签得到纯文本
        const text = line.replace(/\[.*?\]/g, "").trim();
        for (const match of matches) {
            const min = parseInt(match[1], 10);
            const sec = parseInt(match[2], 10);
            const ms = parseInt(match[3].padEnd(3, "0"), 10);
            const time = min * 60 + sec + ms / 1000;
            lyricData.push({
                time,
                text
            });
        }
    }
    // 按时间排序
    lyricData.sort((a, b) => a.time - b.time);
    return lyricData;
}

async function play_song(blob, song, keep_list = false) {
    /*
    { 
        "id": "254059", 
        "name": "情歌", 
        "artist": ["梁静茹"], 
        "album": "现在开始我爱你", 
        "pic_id": "109951168163257789", 
        "url_id": "254059", 
        "lyric_id": "254059", 
        "source": "netease", 
        "from": "music.gdstudio.xyz" 
    }
    */
    if (!keep_list) {
        playlist = null;
    }
    console.log("开始播放:", song.name, "-", song.artist.join(", "));
    lyric = parseLyric(await getLyric(formatSid(song.source, song.lyric_id)));
    console.log("歌词:", lyric);
    audio.src = URL.createObjectURL(blob);
    audio.play();
    current_song = song;
    player_status = "playing";
    update_play_button();
    document.getElementById("player-songname").innerText = song.name;
    document.getElementById("player-artist").innerText = song.artist.join(" / ");
    getPicUrl(song.pic_id).then(pic_url => {
        console.log("封面URL:", pic_url);
        document.getElementById("player-cover").src = pic_url;
    });
}

async function play_song_list_mode(blob, song) {
    await play_song(blob, song, true);
}

async function play_list(list_id, start_id) {
    playlist = (await DBgetSongList(list_id)).data;
    now_id = start_id;
    start_sid = playlist[start_id].sid;
    start_song = await DBgetSongInfo(start_sid);
    start_song.id = parseSid(start_song.sid).id;
    download_song(encodeURIComponent(JSON.stringify(start_song)), play_song_list_mode);
}

function on_play_button_click() {
    if (player_status === "playing") {
        audio.pause();
        player_status = "paused";
    } else if (player_status === "paused") {
        audio.play();
        player_status = "playing";
    } else if (player_status === "ended") {
        audio.currentTime = 0;
        audio.play();
        player_status = "playing";
    }
    update_play_button();
}

document.getElementById("player-ctl-btn").addEventListener("click", on_play_button_click);

function update_progress() {
    const progressBar = document.getElementById("player-progress-bar");
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    if (!isNaN(duration) && duration > 0) {
        const percent = (currentTime / duration) * 100;
        progressBar.value = percent;
    }
}

function update_time() {
    const currentTimeEl = document.getElementById("player-time");
    const durationEl = document.getElementById("player-duration");
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    if (!isNaN(duration) && duration > 0) {
        currentTimeEl.innerText = format_time(currentTime);
        durationEl.innerText = format_time(duration);
    } else {
        currentTimeEl.innerText = "00:00";
        durationEl.innerText = "00:00";
    }
}

function format_time(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function on_progress_bar_change(event) {
    const progressBar = event.target;
    const percent = progressBar.value;
    if (audio.duration) {
        audio.currentTime = (percent / 100) * audio.duration;
    }
}

document.getElementById("player-progress-bar").addEventListener("input", on_progress_bar_change);

function on_clicked_download() {
    if (current_song) {
        console.log(audio.src);
        savename = current_song.name + " - " + current_song.artist.join(" / ");
        const url = audio.src;
        const a = document.createElement("a");
        a.href = url;
        a.download = savename + ".mp3";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
}

document.getElementById("player-download-btn").addEventListener("click", on_clicked_download);

function on_clicker_mode_btn(event) {
    btn = document.getElementById("player-loopmode-btn");
    if (loop_mode === "order") {
        loop_mode = "repeat";
        btn.innerHTML = '<i class="bi bi-repeat-1"></i>';
        console.log("已切换到单曲循环");
    } else if (loop_mode === "repeat") {
        loop_mode = "shuffle";
        btn.innerHTML = '<i class="bi bi-shuffle"></i>';
        console.log("已切换到随机播放");
    } else {
        loop_mode = "order";
        btn.innerHTML = '<i class="bi bi-list-ol"></i>';
        console.log("已切换到顺序播放");
    }
}

document.getElementById("player-loopmode-btn").addEventListener("click", on_clicker_mode_btn);

async function on_song_end() {
    document.getElementById("lyric-1").innerText = "";
    document.getElementById("lyric-2").innerText = "暂无歌词";
    document.getElementById("lyric-3").innerText = "";
    player_status = "ended";
    update_play_button();
    if (loop_mode === "repeat") {
        audio.currentTime = 0;
        audio.play();
        player_status = "playing";
    }
    else if (playlist == null) {
        audio.currentTime = 0;
    }
    else {
        console.log(loop_mode);
        if (loop_mode == "order") {
            now_id = (now_id + 1) % playlist.length;
            now_sid = playlist[now_id].sid;
            now_song = await DBgetSongInfo(now_sid);
            now_song.id = parseSid(now_song.sid).id;
            download_song(encodeURIComponent(JSON.stringify(now_song)), play_song_list_mode);
        }
        else {
            let next;
            if (playlist.length <= 1) {
                next = now_id;
            } else {
                do {
                    next = Math.floor(Math.random() * playlist.length);
                } while (next === now_id);
            }
            now_id = next;
            now_sid = playlist[now_id].sid;
            now_song = await DBgetSongInfo(now_sid);
            now_song.id = parseSid(now_song.sid).id;
            download_song(encodeURIComponent(JSON.stringify(now_song)), play_song_list_mode);
        }
    }
}

function find_lyric_index(currentTime) {
    if (!lyric || lyric.length === 0) return -1;
    let l = 0, r = lyric.length - 1;
    while (l <= r) {
        let mid = (l + r) >> 1;
        if (lyric[mid].time <= currentTime) {
            l = mid + 1;
        }
        else {
            r = mid - 1;
        }
    }
    return r;
}

function update_lyric() {
    if (!lyric) return;
    const currentTime = audio.currentTime;
    const index = find_lyric_index(currentTime);
    const lyricEl = document.getElementById("lyric-2");
    lyricEl.innerText = index >= 0 ? lyric[index].text : "";
    if (index >= 1) {
        document.getElementById("lyric-1").innerText = lyric[index - 1].text;
    } else {
        document.getElementById("lyric-1").innerText = "";
    }
    if (index + 1 < lyric.length) {
        document.getElementById("lyric-3").innerText = lyric[index + 1].text;
    } else {
        document.getElementById("lyric-3").innerText = "";
    }
}

audio.addEventListener("timeupdate", update_lyric);