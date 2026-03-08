async function load_song_lists() {
    lt = document.getElementById("song-lists");
    lt.innerHTML = "";
    data = await DBgetSongLists();
    // <div class="listitem">
    //     SL1
    //     <div class="right" style="color:red;">
    //         <a href="javascript:;" id="import">
    //             <i class="bi bi-x-lg"></i>
    //         </a>
    //     </div>
    // </div>
    console.log("刷新歌单数据:", data);
    data.forEach(songList => {
        let list_item = document.createElement("div");
        list_item.className = "listitem";
        list_item.onclick = () => {
            load_list_detail(songList.id);
        };
        list_item.innerHTML = `${songList.name}
            <div class="right" style="color:red;">
                <a href="javascript:;" onclick="delete_song_list(${songList.id})">
                    <i class="bi bi-x-lg"></i>
                </a>
                <a onclick="sure_delete_song_list(${songList.id})" style="color:red;display:none;" id="sure-delete-btn-${songList.id}">
                    确认
                </a>
            </div>
        `;
        lt.appendChild(list_item);
    });
}

load_song_lists();

function new_song_list() {
    list_name = document.getElementById("new-playlist-input").value.trim();
    if (list_name) {
        DBnewSongList(list_name);
        load_song_lists();
        document.getElementById("new-playlist-input").value = "";
        document.getElementById("new-playlist-overlay").classList.remove("show");
    }
}

document.getElementById("new-playlist-ok-btn").addEventListener("click", new_song_list);
document.getElementById("new-playlist-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        new_song_list();
    }
});

function delete_song_list(list_id) {
    sure_btn = document.getElementById(`sure-delete-btn-${list_id}`);
    sure_btn.style.display = "inline";
    setTimeout(() => {
        sure_btn.style.display = "none";
    }, 3000);
}

async function sure_delete_song_list(list_id) {
    DBdeleteSongList(list_id);
    load_song_lists();
    if ((await DBgetSetting("lastSongList")) == list_id) {
        DBsetSetting("lastSongList", -1);
        init_list_detail();
    }
}

function init_list_detail() {
    document.getElementById("list-detail-title").innerText = "暂无歌单";
    document.getElementById("list-detail-list").innerHTML = "";
    document.getElementById("list-detail-add-btn").style.display = "none";
}

init_list_detail();

async function load_list_detail(list_id) {
    console.log("加载歌单", list_id)
    list = await DBgetSongList(list_id);
    document.getElementById("list-detail-title").innerText = list.name;
    document.getElementById("list-detail-list").innerHTML = "";
    document.getElementById("list-detail-add-btn").style.display = "block";
    // <div class="listitem">
    //     S1
    //     <div class="right">
    //         <a href="javascript:;" id="play">
    //             <i class="bi bi-play"></i>
    //         </a>
    //         <a href="javascript:;" id="download">
    //             <i class="bi bi-download"></i>
    //         </a>
    //         <a href="javascript:;" style="color: red;" id="remove">
    //             <i class="bi bi-x-lg"></i>
    //         </a>
    //     </div>
    // </div>
    lt = document.getElementById("list-detail-list");
    lt.innerHTML = "";
    console.log(list);
    for (let i = 0; i < list.data.length; i++) {
        song_info = list.data[i];
        song = await DBgetSongInfo(song_info.sid);
        let list_item = document.createElement("div");
        list_item.className = "listitem";
        list_item.innerHTML = `${song_info.name}
            <div class="right">
                <a href="javascript:;" id="play" onclick="play_list(${list_id},${i})">
                    <i class="bi bi-play"></i>
                </a>
                <a href="javascript:;" id="download" onclick="download_song('${encodeURIComponent(JSON.stringify(song))}')">
                    <i class="bi bi-download"></i>
                </a>
                <a href="javascript:;" style="color: red;" id="remove" onclick="remove_from_list(${list_id},'${song.sid}')">
                    <i class="bi bi-x-lg"></i>
                </a>
            </div>
        `;
        lt.appendChild(list_item);
    }
    document.getElementById("list-detail-add-btn").onclick = () => {
        search_insert_to_list_id = list_id;
        showModal('song-search-overlay');
    }
    DBsetSetting("lastSongList", list_id);
}

async function auto_load_list_detail() {
    lid = await DBgetSetting("lastSongList")
    if (lid != -1) {
        if (lid == null) {
            await db.settings.put({ key: "lastSongList", value: -1 });
        }
        else {
            console.log("上一次访问的歌单", lid)
            load_list_detail(lid);
        }
    }
}

auto_load_list_detail();

sid_to_playlist = null;
songname_to_playlist = null;

async function add_to_list(song, list_id = 1) {
    song_txt = song;
    song = JSON.parse(decodeURIComponent(song));
    let sid = formatSid(song.source, song.id);
    await download_song(song_txt, function (a, b) { });
    await getPicUrl(sid);
    await getLyric(sid);
    let list = await DBgetSongLists();
    console.log(list);
    let select = document.getElementById("add-to-playlist-select");
    select.innerHTML = "";
    list.forEach(item => {
        let option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
    });
    if (list_id == -1 && list.length) {
        list_id = list[0].id;
    }
    select.value = list_id;
    document.getElementById("add-to-playlist-songname").innerText = song.name;
    document.getElementById("add-to-playlist-overlay").classList.add("show");
    sid_to_playlist = sid;
    songname_to_playlist = song.name + " - " + song.artist.join(" / ");
}

async function remove_from_list(list_id, sid) {
    DBremoveFromSongList(list_id, sid);
    load_list_detail(list_id);
}

async function add_ok() {
    if (sid_to_playlist && songname_to_playlist) {
        list_id = document.getElementById("add-to-playlist-select").value;
        await DBinsertToSongList(parseInt(list_id), sid_to_playlist, songname_to_playlist);
        document.getElementById("add-to-playlist-overlay").classList.remove("show");
        load_list_detail(parseInt(list_id));
    }
}

document.getElementById("add-to-playlist-ok-btn").addEventListener("click", add_ok)