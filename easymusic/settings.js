async function loadSettings() {
    document.getElementById("saveInfo-st").checked = await DBgetSetting("saveInfo");
    document.getElementById("saveLyric-st").checked = await DBgetSetting("saveLyric");
    document.getElementById("saveListSong-st").checked = await DBgetSetting("saveListSong");
    document.getElementById("saveAllSong-st").checked = await DBgetSetting("saveAllSong");
    document.getElementById("downloadQuality-st").value = await DBgetSetting("downloadQuality");
    document.getElementById("apiTestF-st").value = await DBgetSetting("apiTestF");
}

document.getElementById("save-settings-btn").addEventListener("click", async () => {
    console.log("Saving settings...");
    await DBsetSetting("saveInfo", document.getElementById("saveInfo-st").checked);
    await DBsetSetting("saveLyric", document.getElementById("saveLyric-st").checked);
    await DBsetSetting("saveListSong", document.getElementById("saveListSong-st").checked);
    await DBsetSetting("saveAllSong", document.getElementById("saveAllSong-st").checked);
    await DBsetSetting("downloadQuality", document.getElementById("downloadQuality-st").value);
    await DBsetSetting("apiTestF", document.getElementById("apiTestF-st").value);
    document.getElementById("settings-modal").classList.remove("show");
});

window.addEventListener("DOMContentLoaded", loadSettings);

document.getElementById("settings-btn").addEventListener("click", loadSettings);