search_insert_to_list_id = -1;

async function song_search(event, songlist = search_insert_to_list_id, count = 1) {
    console.log("正在搜索歌曲，尝试第" + count + "次……");
    keyword = document.getElementById("song-search-input").value;
    source = document.getElementById("search-select").value;
    result = await fetch("https://music-api.gdstudio.xyz/api.php?types=search&source=" + source + "&name=" + keyword + "&count=20&pages=1");
    if (result.status == 200) {
        data = await result.json();
        console.log(data);
        if (data.length == 0) {
            let result_container = document.getElementById("song-search-results");
            result_container.innerHTML = "";
            let song_item = document.createElement("div");
            song_item.className = "song-search-item";
            if (count >= 4) {
                song_item.innerHTML = `
                    <div class="songname" style="color: red;">API未返回结果，请稍后再试</div>
                `;
                result_container.appendChild(song_item);
                return;
            }
            song_item.innerHTML = `
                <div class="songname" style="color: red;">API未返回结果（第${count}次重试）……</div>
            `;
            result_container.appendChild(song_item);
            setTimeout(() => {
                song_search(event, songlist, count + 1);
            }, 200 * count * count);
            return;
        }
        // 显示搜索结果
        let result_container = document.getElementById("song-search-results");
        result_container.innerHTML = "";
        data.forEach(song => {
            let song_item = document.createElement("div");
            let name = song.name;
            let artists = song.artist.join(" / ");
            // console.log(name, artists);
            song_item.title = name + " - " + artists;
            song_item.className = "song-search-item";
            song_item.innerHTML = `
                <div class="songname">${song_item.title}</div>
                <div class="right">
                    <a href="javascript:;" onclick="download_song('${encodeURIComponent(JSON.stringify(song))}',play_song)" id="play">
                        <i class="bi bi-play"></i>
                    </a>
                    <a href="javascript:;" onclick="download_song('${encodeURIComponent(JSON.stringify(song))}')" id="download">
                        <i class="bi bi-download"></i>
                    </a>
                    <a href="javascript:;" id="add" onclick="add_to_list('${encodeURIComponent(JSON.stringify(song))}',${songlist})">
                        <i class="bi bi-plus-lg"></i>
                    </a>
                </div>
            `;
            result_container.appendChild(song_item);
        });
        /*
        [
            {
                "id": "2062623445",
                "name": "想你时风起",
                "artist": [
                    "单依纯"
                ],
                "album": "我的人间烟火 电视剧原声带",
                "pic_id": "109951168728196721",
                "url_id": "2062623445",
                "lyric_id": "2062623445",
                "source": "netease",
                "from": "music.gdstudio.xyz"
            },
            ...
        */
    } else {
        let result_container = document.getElementById("song-search-results");
        result_container.innerHTML = "";
        let song_item = document.createElement("div");
        song_item.className = "song-search-item";
        song_item.innerHTML = `
                <div class="songname" style="color: red;">网络错误或输入为空</div>
            `;
        result_container.appendChild(song_item);
    }
}

document.getElementById("song-search-btn").addEventListener("click", song_search);
document.getElementById("song-search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        song_search();
    }
});