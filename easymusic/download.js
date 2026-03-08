async function download_song(song, onBlob, force = false) {
    console.log(song);
    song = JSON.parse(decodeURIComponent(song));
    if (song.sid) {
        sid = song.sid;
    } else {
        sid = formatSid(song.source, song.id);
    }
    console.log("下载：", sid, song)
    title = song.name;
    artists = song.artist;
    const source = song.source;
    const id = song.id;
    console.log(JSON.stringify(song));
    const savename = title + " - " + artists.join(" / ");
    if (!force && await DBgetSongUrl(sid, await DBgetSetting("downloadQuality"))) {
        const url = await DBgetSongUrl(sid, await DBgetSetting("downloadQuality"));
        console.log("从数据库获取URL:", url);
        if (await DBgetSongData(url)) {
            const songData = await DBgetSongData(url);
            console.log("从数据库获取歌曲数据");
            if (onBlob) {
                onBlob(songData.data, song);
            }
            else {
                saveBlob(songData.data, savename);
            }
            return;
        }
    }
    // ====== UI 初始化 ======
    const modal = document.getElementById("download-progress-modal");
    const nameEl = document.getElementById("download-data-name");
    const bar = document.getElementById("download-progress-bar");
    const percentText = document.getElementById("download-progress-percent");
    modal.classList.add("show");
    nameEl.innerText = savename;
    bar.style.width = "0%";
    percentText.innerText = "准备下载...";
    download_url = "";
    try {
        const br = await DBgetSetting("downloadQuality");
        const apiRes = await fetch(
            "https://music-api.gdstudio.xyz/api.php?types=url&id="
            + id + "&source=" + source + "&br=" + br
        );
        if (apiRes.status !== 200) {
            throw new Error("解析失败，状态码：" + apiRes.status);
        }
        console.log("API响应:", apiRes);
        const data = await apiRes.json();
        console.log("API数据:", data);
        download_url = data.url;
        // const data = await apiRes.json();
        const response = await fetch(data.url);
        const contentLength = response.headers.get("Content-Length");
        if (!contentLength) {
            percentText.innerText = "无法获取文件大小";
            const blob = await response.blob();
            saveBlob(blob, savename);
            modal.style.display = "none";
            return;
        }
        const total = parseInt(contentLength, 10);
        let loaded = 0;
        const reader = response.body.getReader();
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            const percent = ((loaded / total) * 100).toFixed(2);
            const loadedMB = (loaded / 1024 / 1024).toFixed(2);
            const totalMB = (total / 1024 / 1024).toFixed(2);
            // ====== 更新 UI ======
            bar.style.width = percent + "%";
            percentText.innerText = `${loadedMB}MB / ${totalMB}MB  ${percent}%`;
        }
        const blob = new Blob(chunks);

        const songInfo = {
            sid,
            name: title,
            artist: artists,
            album: song.album,
            pic_id: song.pic_id,
            url_id: song.url_id,
            lyric_id: song.lyric_id,
            source: song.source,
            from: song.from
        };
        await DBsaveSongInfo(songInfo);

        await DBsaveSongUrl(sid, await DBgetSetting("downloadQuality"), download_url);

        const songData = {
            url: download_url,
            data: blob
        };
        await DBsaveSongData(songData);

        if (onBlob) {
            onBlob(blob, song);
        }
        else {
            saveBlob(blob, savename);
        }
        percentText.innerText = "下载完成";
        modal.classList.remove("show");
    } catch (err) {
        console.error(err);
        percentText.innerText = "下载失败";
        bar.style.width = "0%";
        setTimeout(() => {
            modal.classList.remove("show");
        }, 1000);
    }
}

function saveBlob(blob, savename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = savename + ".mp3";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

async function getPicUrl(pic_id, force = false) {
    if (!force && await DBgetPicUrl(pic_id)) {
        return await DBgetPicUrl(pic_id);
    }
    if (!pic_id) return "";
    //https://music-api.gdstudio.xyz/api.php?types=pic&source=[MUSIC SOURCE]&id=[PIC ID]&size=[300/500]
    const apiRes = await fetch(
        "https://music-api.gdstudio.xyz/api.php?types=pic&id=" + pic_id + "&size=300"
    );
    if (apiRes.status !== 200) {
        console.error("获取图片URL失败，状态码：" + apiRes.status);
        return "";
    }
    const data = await apiRes.json();
    await DBsavePicUrl(pic_id, data.url);
    return data.url;
}

async function getLyric(sid, force = false) {
    if (!force && await DBgetLyric(sid)) {
        return await DBgetLyric(sid);
    }
    //https://music-api.gdstudio.xyz/api.php?types=lyric&source=[MUSIC SOURCE]&id=[LYRIC ID]
    console.log("正在获取歌词，", "https://music-api.gdstudio.xyz/api.php?types=lyric&id=" + parseSid(sid).id + "&source=" + parseSid(sid).source);
    const apiRes = await fetch(
        "https://music-api.gdstudio.xyz/api.php?types=lyric&id=" + parseSid(sid).id + "&source=" + parseSid(sid).source
    );
    if (apiRes.status !== 200) {
        console.error("获取歌词失败，状态码：" + apiRes.status);
        return "";
    }
    const data = await apiRes.json();
    await DBsaveLyric(sid, data.lyric);
    return data.lyric;
}

async function getSongInfo(sid) {
    return await DBgetSongInfo(sid);
}

async function getSongUrl(sid, quality) {
    return await DBgetSongUrl(sid, quality);
}