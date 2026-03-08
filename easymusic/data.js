const db = new Dexie("MusicDB");

db.version(1).stores({
    songs: "sid,name,artist,album,pic_id,url_id,lyric_id,source,from",
    songlists: "++id,name,data",
    lyric: "sid,lyric",
    pic: "sid,url",
    songurl: "sid,br28,br192,br320,br740,br999",
    songdatas: "url,data",
    settings: "key"
});

async function DBinitSettings() {
    await db.settings.put({ key: "saveInfo", value: true });
    await db.settings.put({ key: "saveLyric", value: true });
    await db.settings.put({ key: "saveListSong", value: true });
    await db.settings.put({ key: "saveAllSong", value: true });
    await db.settings.put({ key: "downloadQuality", value: 740 });
    await db.settings.put({ key: "apiTestF", value: "1h" });
    await db.settings.put({ key: "lastSongList", value: -1 });
}

// db.on("populate", async () => );

async function initDB() {
    try {
        await db.open();
    } catch (err) {
        console.warn("数据库结构变更，删除重建");
        await Dexie.delete("MusicDB");
        await db.open();
    }

    if ((await DBgetSetting("saveInfo")) == null) {
        await DBinitSettings();
    }
}

initDB();

function parseSid(str) {
    const match = str.match(/^(.+)-(\d+)$/);
    if (!match) return null;

    return {
        source: match[1],
        id: Number(match[2])
    };
}

function formatSid(source, id) {
    return `${source}-${id}`;
}

async function DBgetSetting(key) {
    const setting = await db.settings.get(key);
    return setting?.value ?? null;
}

async function DBsetSetting(key, value) {
    await db.settings.put({ key, value });
}

async function DBgetSongInfo(sid) {
    return await db.songs.get(sid);
}

async function DBsaveSongInfo(song) {
    await db.songs.put(song);
}

async function DBgetSongUrl(sid, quality) {
    const urlData = await db.songurl.get(sid);
    if (urlData && urlData["br" + quality]) {
        return urlData["br" + quality];
    }
    return null;
}

async function DBsaveSongUrl(sid, quality, url) {
    let urlData = await db.songurl.get(sid);
    if (!urlData) {
        urlData = { sid };
    }
    urlData["br" + quality] = url;
    await db.songurl.put(urlData);
}

async function DBgetSongData(url) {
    return await db.songdatas.get(url);
}

async function DBsaveSongData(songData) {
    await db.songdatas.put(songData);
}

async function DBgetLyric(sid) {
    return await db.lyric.get(sid);
}

async function DBsaveLyric(sid, lyric) {
    await db.lyric.put({ sid, lyric });
}

async function DBgetPicUrl(sid) {
    const pic = await db.pic.get(sid);
    return pic?.url ?? null;
}

async function DBsavePicUrl(sid, url) {
    await db.pic.put({ sid, url });
}

async function DBsaveSongList(name, data) {
    await db.songlists.add({ name, data });
}

async function DBgetSongLists() {
    return await db.songlists.toArray();
}

async function DBgetSongList(id) {
    return await db.songlists.get(id);
}

async function DBdeleteSongList(id) {
    await db.songlists.delete(id);
}

async function DBupdateSongList(id, name, data) {
    await db.songlists.update(id, { name, data });
}

async function DBnewSongList(name) {
    await db.songlists.add({ name, data: [] });
}

async function DBgetSongLists() {
    return await db.songlists.toArray();
}

async function DBgetSongList(id) {
    return await db.songlists.get(id);
}

async function DBdeleteSongList(id) {
    await db.songlists.delete(id);
}

async function DBupdateSongList(id, name, data) {
    await db.songlists.update(id, { name, data });
}

async function DBnewSongList(name) {
    await db.songlists.add({ name, data: [] });
}

async function DBinsertToSongList(id, sid, name) {
    let list = await db.songlists.get(id);
    if (!list) return;
    if (list.data.some(song => song.sid === sid)) {
        return;
    }
    list.data.push({
        sid: sid,
        name: name
    });
    await db.songlists.update(id, { data: list.data });
}

async function DBremoveFromSongList(id, sid) {
    await db.songlists.update(id, list => {
        if (!list.data) return;
        list.data = list.data.filter(song => song.sid !== sid);
    });
}

async function DBclearAllData() {
    await db.songs.clear();
    await db.songdatas.clear();
    await db.songlists.clear();
}

async function DBgetUsedSize() {
    const estimate = await navigator.storage.estimate();
    return (estimate.usage / 1024 / 1024).toFixed(2) + " MB";
}

async function DBgetTotalSize() {
    const estimate = await navigator.storage.estimate();
    if (estimate.quota) {
        return (estimate.quota / 1024 / 1024).toFixed(2) + " MB";
    } else {
        return "未知";
    }
}