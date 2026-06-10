/*
IDBBackup (streaming)

Usage:
  - Export:
      await IDBBackup.exportDB(dbName, {
        gzip: true,            // default true
        progress: ({store, count, bytes}) => {},
      })

    Produces a download via streamSaver. Uses streaming export to avoid holding
    the full database in memory. Binary fields (Blob/ArrayBuffer/View) are
    streamed as raw bytes.

  - Import:
      await IDBBackup.importDB(file, {
        targetDB: "my-db",    // optional override of database name
        progress: ({store, count, bytes}) => {},
      })

    Imports from a backup file and writes into indexedDB using streaming
    reads. Progress is reported per row.

Notes:
  - File format: [u32 length + JSON record]... with binary payloads stored as
    [u32 length + raw bytes].
  - A .gz suffix on the file will use CompressionStream/DecompressionStream when
    available.
*/

class IDBBackup {
    static encoder = new TextEncoder()
    static decoder = new TextDecoder()
    /* open db */
    static openDB(name) {
        return new Promise((res, rej) => {
            const r = indexedDB.open(name)
            r.onsuccess = e => res(e.target.result)
            r.onerror = rej
        })
    }
    /* schema */
    static async getSchema(dbName) {
        const db = await this.openDB(dbName)
        const schema = {
            name: db.name,
            version: db.version,
            stores: []
        }
        for (const name of db.objectStoreNames) {
            const tx = db.transaction(name)
            const store = tx.objectStore(name)
            schema.stores.push({
                name,
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
                indexes: Array.from(store.indexNames).map(i => {
                    const idx = store.index(i)
                    return {
                        name: idx.name,
                        keyPath: idx.keyPath,
                        unique: idx.unique,
                        multiEntry: idx.multiEntry
                    }
                })
            })
        }
        db.close()
        return schema
    }
    /* binary detect */
    static isBinary(v) {
        return (
            v instanceof Blob ||
            v instanceof ArrayBuffer ||
            ArrayBuffer.isView(v)
        )
    }
    /* write uint32 */
    static async writeU32(writer, n) {
        const buf = new Uint8Array(4)
        new DataView(buf.buffer).setUint32(0, n, true)
        console.log(buf);
        await writer.write(buf)
    }
    /* read uint32 */
    static async readU32(reader) {
        let buf = new Uint8Array(4)
        let off = 0
        while (off < 4) {
            const { value } = await reader.read()
            if (!value) return null
            const chunk = value.slice(0, 4 - off)
            buf.set(chunk, off)
            off += chunk.length
        }
        return new DataView(buf.buffer).getUint32(0, true)
    }
    /* export */
    static async exportDB(dbName, ignore_list = [], { gzip = false, progress = () => { } } = {}) {
        const schema = await this.getSchema(dbName)
        const filename = dbName + ".idbbackup" + (gzip ? ".gz" : "")
        const fileStream = streamSaver.createWriteStream(filename)
        let writer
        if (gzip && "CompressionStream" in window) {
            const gzipStream = new CompressionStream("gzip")
            gzipStream.readable.pipeTo(fileStream)
            writer = gzipStream.writable.getWriter()
        } else {
            writer = fileStream.getWriter()
        }

        const writePromises = []
        const writeJSON = async obj => {
            const data = this.encoder.encode(JSON.stringify(obj))
            await this.writeU32(writer, data.length)
            console.log(data);
            await writer.write(data)
        }

        const writeBlob = async blob => {
            const size = blob.size
            await this.writeU32(writer, size)
            console.log("blob : ", size);
            const promises = []
            if (blob.stream) {
                const reader = blob.stream().getReader()
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    promises.push(writer.write(value))
                }
            } else {
                const data = new Uint8Array(await blob.arrayBuffer())
                promises.push(writer.write(data))
            }
            return Promise.all(promises)
        }

        await writeJSON({ type: "header", magic: "IDBBackup", version: 1 })
        await writeJSON({ type: "schema", schema })
        const db = await this.openDB(dbName)
        let count = 0
        let bytes = 0

        // ===== 初始化 =====

        const isBinary = (v) => this.isBinary(v)

        const queue = []
        let readingDone = false

        async function dataWriter() {
            while (!readingDone || queue.length > 0) {
                if (queue.length === 0) {
                    await new Promise(r => setTimeout(r, 0))
                    continue
                }

                const task = queue.shift()

                await writeJSON(task.json)

                for (const blob of task.blobs) {
                    await writeBlob(blob)
                    bytes += blob.size
                }

                count++
                progress({
                    store: task.json.store,
                    count,
                    bytes
                })
            }
        }
        const writerPromise = dataWriter()
        for (const storeName of db.objectStoreNames) {
            if (ignore_list.includes(storeName)) continue

            queue.push({
                json: { type: "store", name: storeName },
                blobs: []
            })

            const tx = db.transaction(storeName)
            const store = tx.objectStore(storeName)

            await new Promise((resolve, reject) => {
                const req = store.openCursor()

                req.onsuccess = (e) => {
                    const cursor = e.target.result

                    if (!cursor) {
                        resolve()
                        return
                    }

                    const row = cursor.value
                    const value = {}
                    const blobs = []

                    for (const k in row) {
                        const v = row[k]

                        if (isBinary(v)) {
                            const blob = v instanceof Blob
                                ? v
                                : v instanceof ArrayBuffer
                                    ? new Blob([v])
                                    : new Blob([v.buffer])

                            blobs.push(blob)

                            value[k] = {
                                __binary: true,
                                index: blobs.length - 1
                            }
                        } else {
                            value[k] = v
                        }
                    }

                    queue.push({
                        json: {
                            type: "row",
                            store: storeName,
                            value,
                            binaries: blobs.map((_, i) => ({ index: i }))
                        },
                        blobs
                    })

                    cursor.continue()
                }

                req.onerror = reject
                tx.onabort = () => reject(tx.error || new Error("Transaction aborted"))
                tx.onerror = () => reject(tx.error)
            })
        }

        readingDone = true

        await writerPromise

        await writeJSON({ type: "end" })
        await Promise.all(writePromises)
        await writer.close()
        db.close()
    }
    /* import */
    static async importDB(file, { targetDB = null, progress = () => { } } = {}) {
        // Handle data URL if file is saved as text
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.size < 1000) {
            try {
                const text = await file.text()
                if (text.startsWith('data:')) {
                    const commaIndex = text.indexOf(',')
                    const base64 = text.substring(commaIndex + 1)
                    const binaryString = atob(base64)
                    const bytes = new Uint8Array(binaryString.length)
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i)
                    }
                    file = new Blob([bytes])
                }
            } catch (e) {
                // Ignore, proceed with original file
            }
        }

        if (file.name.endsWith(".gz")) {
            throw new Error("Please decompress the .gz file manually using external tools (e.g., 7-Zip, gzip) and rename it to .idbbackup before importing.")
        }

        let stream = file.stream()
        // Check if the file is a data URL or hex dump text file
        const tempReader = stream.getReader()
        const { value: firstChunk, done } = await tempReader.read()
        if (!done && firstChunk) {
            const sampleText = new TextDecoder().decode(firstChunk.slice(0, Math.min(200, firstChunk.length)))
            if (sampleText.startsWith('data:')) {
                // Data URL text file
                tempReader.cancel()
                const fullText = await new Response(file.stream()).text()
                const commaIndex = fullText.indexOf(',')
                const base64 = fullText.substring(commaIndex + 1)
                const binaryString = atob(base64)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                }
                file = new Blob([bytes])
                stream = file.stream()
            } else {
                const cleaned = sampleText.replace(/\s/g, '')
                if (/^[0-9a-fA-F]+$/.test(cleaned)) {
                    // Hex dump text file
                    tempReader.cancel()
                    const fullText = await new Response(file.stream()).text()
                    const hex = fullText.replace(/\s/g, '')
                    const bytes = new Uint8Array(hex.length / 2)
                    for (let i = 0; i < hex.length; i += 2) {
                        bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
                    }
                    file = new Blob([bytes])
                    stream = file.stream()
                } else {
                    // Binary file, recreate stream
                    const newStream = new ReadableStream({
                        start(controller) {
                            controller.enqueue(firstChunk)
                            tempReader.read().then(function process({ value, done }) {
                                if (done) {
                                    controller.close()
                                    return
                                }
                                controller.enqueue(value)
                                tempReader.read().then(process)
                            })
                        }
                    })
                    stream = newStream
                }
            }
        }
        const reader = stream.getReader()

        class BufferedReader {
            constructor(reader) {
                this.reader = reader
                this.buffer = new Uint8Array(0)
                this.offset = 0
            }

            async _fill() {
                if (this.offset > 0) {
                    this.buffer = this.buffer.subarray(this.offset)
                    this.offset = 0
                }
                const { value, done } = await this.reader.read()
                if (done) return false
                const combined = new Uint8Array(this.buffer.length + value.length)
                combined.set(this.buffer)
                combined.set(value, this.buffer.length)
                this.buffer = combined
                return true
            }

            async readExactly(len) {
                while (this.buffer.length - this.offset < len) {
                    const ok = await this._fill()
                    if (!ok) throw new Error("Unexpected EOF")
                }
                const out = this.buffer.subarray(this.offset, this.offset + len)
                this.offset += len
                return out
            }
        }

        const br = new BufferedReader(reader)

        const readU32 = async () => {
            const buf = await br.readExactly(4)
            console.log(buf);
            return new DataView(buf.buffer, buf.byteOffset, 4).getUint32(0, true)
        }

        const readJSON = async () => {
            const len = await readU32()
            const buf = await br.readExactly(len)
            const str = this.decoder.decode(buf)
            console.log(str);
            if (str.length > 0 && str[0] !== '{' && str[0] !== '[') {
                throw new Error(`Invalid backup file: expected JSON starting with '{' or '[', got '${str[0]}'`)
            }
            return JSON.parse(str)
        }

        const readBinaryBlob = async () => {
            const len = await readU32()
            let remaining = len
            const parts = []
            const chunkSize = 64 * 1024
            while (remaining > 0) {
                const toRead = Math.min(remaining, chunkSize)
                const chunk = await br.readExactly(toRead)
                parts.push(chunk.slice())
                remaining -= chunk.length
            }
            return { blob: new Blob(parts), length: len }
        }

        let db = null
        let currentStore = null
        let currentTx = null
        let currentStoreObj = null
        let count = 0
        let bytes = 0

        const commitTx = () => {
            if (!currentTx) return Promise.resolve()
            return new Promise((res, rej) => {
                currentTx.oncomplete = res
                currentTx.onerror = rej
                currentTx.onabort = rej
            }).finally(() => {
                currentTx = null
                currentStoreObj = null
            })
        }

        while (true) {
            const obj = await readJSON()
            if (!obj) break
            if (obj.type === "header") {
                if (obj.magic !== "IDBBackup" || obj.version !== 1) {
                    throw new Error("Invalid backup file: not a valid IDBBackup file")
                }
                continue
            }
            if (obj.type === "schema") {
                db = await new Promise((res, rej) => {
                    const req = indexedDB.open(
                        targetDB || obj.schema.name,
                        obj.schema.version
                    )
                    req.onupgradeneeded = e => {
                        const db = e.target.result
                        for (const s of obj.schema.stores) {
                            const store = db.createObjectStore(
                                s.name,
                                {
                                    keyPath: s.keyPath,
                                    autoIncrement: s.autoIncrement
                                }
                            )
                            for (const idx of s.indexes) {
                                store.createIndex(
                                    idx.name,
                                    idx.keyPath,
                                    {
                                        unique: idx.unique,
                                        multiEntry: idx.multiEntry
                                    }
                                )
                            }
                        }
                    }
                    req.onsuccess = e => res(e.target.result)
                    req.onerror = rej
                })
            }
            if (obj.type === "store") {
                currentStore = obj.name
                continue
            }

            if (obj.type === "row") {

                let val = obj.value

                if (obj.binaries) {
                    for (const b of obj.binaries) {

                        const { blob, length } = await readBinaryBlob()

                        // 🔥 找到对应字段
                        const key = Object.keys(val).find(
                            k => val[k]?.__binary && val[k].index === b.index
                        )

                        if (!key) {
                            console.error("❌ 找不到 binary 对应字段", b, val)
                            continue
                        }

                        val[key] = blob
                        bytes += length
                    }
                }

                await new Promise((resolve, reject) => {
                    const tx = db.transaction(obj.store, "readwrite")
                    const store = tx.objectStore(obj.store)

                    store.put(val)

                    tx.oncomplete = resolve
                    tx.onabort = () => reject(tx.error || new Error("tx abort"))
                    tx.onerror = () => reject(tx.error)
                })

                count++
                progress({
                    store: obj.store,
                    count,
                    bytes
                })
            }

            if (obj.type === "end") break
        }
        await commitTx()
        return db
    }
}
