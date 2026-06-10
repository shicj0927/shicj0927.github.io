async function exportDB(ignore_list = []) {
    if (window.streamSaver && !streamSaver.mitm) {
        streamSaver.mitm = "/streamsaver/mitm.html"
    }
    const modal = document.getElementById("db-progress-modal")
    const bar = document.getElementById("db-progress-bar")
    const percentText = document.getElementById("db-progress-percent")
    const opName = document.getElementById("db-op-name")
    modal.classList.add("show")
    bar.style.width = "0%"
    percentText.textContent = "0%"
    opName.textContent = "统计数据库大小"
    let db
    try {
        db = await new Promise((resolve, reject) => {
            const req = indexedDB.open("MusicDB")
            req.onsuccess = e => resolve(e.target.result)
            req.onerror = reject
        })
        let total = 0
        for (const name of db.objectStoreNames) {
            if (ignore_list.includes(name)) continue
            const tx = db.transaction(name)
            const store = tx.objectStore(name)
            total += await new Promise(res => {
                const r = store.count()
                r.onsuccess = () => res(r.result)
                r.onerror = () => res(0)
            })
        }
        db.close()
        if (total === 0) total = 1
        opName.textContent = "导出数据库"
        const startTime = Date.now()
        let lastUIUpdate = 0
        await IDBBackup.exportDB("MusicDB", ignore_list, {
            gzip: false,
            progress: ({ store, count, bytes }) => {
                const now = Date.now()
                if (now - lastUIUpdate < 100) return
                lastUIUpdate = now
                const percent = Math.min(
                    100,
                    Math.floor(count / total * 100)
                )
                const elapsed = (now - startTime) / 1000
                const speed = elapsed ? bytes / elapsed : 0
                const speedMB = (speed / 1024 / 1024).toFixed(2)
                const remain = total - count
                const rps = elapsed ? count / elapsed : 0
                const eta = rps ? Math.floor(remain / rps) : 0
                const etaText = eta > 60
                    ? Math.floor(eta / 60) + "m"
                    : eta + "s"
                bar.style.width = percent + "%"
                percentText.textContent =
                    speedMB + " MB/s | ETA " +
                    etaText + " | " +
                    percent + "%"
                opName.textContent = "导出 " + store
            }
        })
        bar.style.width = "100%"
        percentText.textContent = "100%"
        opName.textContent = "完成"
    }
    catch (err) {
        console.error(err)
        opName.textContent = "导出失败"
    }
    finally {
        setTimeout(() => {
            modal.classList.remove("show")
        }, 1000)
    }
}
async function importDB() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".idbbackup,.gz"
    input.click()
    input.onchange = async () => {
        const file = input.files[0]
        if (!file) return
        const modal = document.getElementById("db-progress-modal")
        const bar = document.getElementById("db-progress-bar")
        const percentText = document.getElementById("db-progress-percent")
        const opName = document.getElementById("db-op-name")
        modal.classList.add("show")
        bar.style.width = "0%"
        percentText.textContent = "0%"
        opName.textContent = "导入数据库"
        let progressState = {
            store: "",
            count: 0,
            bytes: 0
        }
        const startTime = Date.now()
        let running = true
        let lastUIUpdate = 0
        function updateUI() {
            if (!running) return
            const now = Date.now()
            if (now - lastUIUpdate < 80) {
                requestAnimationFrame(updateUI)
                return
            }
            lastUIUpdate = now
            const { store, count, bytes } = progressState
            const elapsed = (now - startTime) / 1000
            const speed = elapsed ? bytes / elapsed : 0
            const speedMB = (speed / 1024 / 1024).toFixed(2)
            /* 不知道总量 → 循环进度条 */
            const percent = (count % 200) / 2
            bar.style.width = percent + "%"
            percentText.textContent =
                speedMB + " MB/s | " +
                count + " rows"
            opName.textContent =
                store
                    ? "导入 " + store
                    : "导入数据库"
            requestAnimationFrame(updateUI)
        }
        requestAnimationFrame(updateUI)
        try {
            await IDBBackup.importDB(file, {
                progress: ({ store, count, bytes }) => {
                    progressState = {
                        store,
                        count,
                        bytes
                    }
                }
            })
            bar.style.width = "100%"
            percentText.textContent = "100%"
            opName.textContent = "导入完成"
        }
        catch (err) {
            console.error(err)
            opName.textContent = "导入失败"
        }
        finally {
            running = false
            load_song_lists();
            init_list_detail();
            auto_load_list_detail();
            setTimeout(() => {
                modal.classList.remove("show")
            }, 800)
        }
    }
}