import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Trash2, Lock, Music, CheckCircle, AlertCircle, Loader, Link } from "lucide-react"

const PRESIGN_URL = "https://functions.poehali.dev/286c23a6-fa1d-4c21-a362-1245c66f02b2"
const UPLOAD_URL = "https://functions.poehali.dev/e1758a26-5fa9-4491-b37d-9b2885b079d7"
const LIST_URL = "https://functions.poehali.dev/092ca65c-635c-495d-a7af-ad2980594837"
const YANDEX_URL = "https://functions.poehali.dev/11949421-f48b-4bb1-9c38-894398ca3d29"

interface Song {
  id: number
  title: string
  artist: string
  duration: string
  lyrics: string
  url: string
}

type Tab = "upload" | "yandex"

const inputCls = "bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-full"

export default function Admin() {
  const [password, setPassword] = useState("")
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState("")
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>("upload")

  // Upload form
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [duration, setDuration] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "ok" | "error">("idle")
  const [uploadMsg, setUploadMsg] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // Yandex form
  const [yUrl, setYUrl] = useState("")
  const [yTitle, setYTitle] = useState("")
  const [yArtist, setYArtist] = useState("")
  const [yLyrics, setYLyrics] = useState("")
  const [yImporting, setYImporting] = useState(false)
  const [yStatus, setYStatus] = useState<"idle" | "ok" | "error">("idle")
  const [yMsg, setYMsg] = useState("")

  const handleAuth = async () => {
    setLoading(true)
    setAuthError("")
    try {
      const res = await fetch(LIST_URL)
      if (res.ok) {
        const data = await res.json()
        setSongs(data.songs || [])
        setAuthed(true)
      } else {
        setAuthError("Не удалось подключиться к серверу")
      }
    } catch {
      setAuthError("Нет соединения с сервером")
    }
    setLoading(false)
  }

  const refreshSongs = async () => {
    const res = await fetch(LIST_URL)
    const data = await res.json()
    setSongs(data.songs || [])
  }

  const handleUpload = async () => {
    if (!file || !title) {
      setUploadMsg("Укажите название и выберите MP3 файл")
      setUploadStatus("error")
      return
    }
    setUploading(true)
    setUploadStatus("idle")
    setUploadProgress(0)
    try {
      // Step 1: get presigned URL and save metadata
      const presignRes = await fetch(PRESIGN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, title, artist, duration, lyrics, filename: file.name }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok) {
        setUploadStatus("error")
        setUploadMsg(presignData.error || "Ошибка сервера")
        setUploading(false)
        return
      }

      setUploadProgress(20)

      // Step 2: upload file directly to S3 via presigned URL (no size limit!)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("PUT", presignData.upload_url)
        xhr.setRequestHeader("Content-Type", "audio/mpeg")
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(20 + Math.round((e.loaded / e.total) * 75))
          }
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`S3 error: ${xhr.status}`))
        xhr.onerror = () => reject(new Error("Ошибка загрузки файла"))
        xhr.send(file)
      })

      setUploadProgress(100)
      setUploadStatus("ok")
      setUploadMsg("Песня успешно загружена!")
      setTitle(""); setArtist(""); setDuration(""); setLyrics(""); setFile(null)
      if (fileRef.current) fileRef.current.value = ""
      await refreshSongs()
    } catch (e: unknown) {
      setUploadStatus("error")
      setUploadMsg(e instanceof Error ? e.message : "Ошибка загрузки")
    }
    setUploading(false)
  }

  const handleYandexImport = async () => {
    if (!yUrl) {
      setYMsg("Вставьте ссылку на трек")
      setYStatus("error")
      return
    }
    setYImporting(true)
    setYStatus("idle")
    try {
      const res = await fetch(YANDEX_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, url: yUrl, title: yTitle || undefined, artist: yArtist || undefined, lyrics: yLyrics }),
      })
      const data = await res.json()
      if (res.ok) {
        setYStatus("ok")
        setYMsg(`Трек "${data.title}" импортирован!`)
        setYUrl(""); setYTitle(""); setYArtist(""); setYLyrics("")
        await refreshSongs()
      } else {
        setYStatus("error")
        setYMsg(data.error || "Ошибка импорта")
      }
    } catch {
      setYStatus("error")
      setYMsg("Ошибка соединения")
    }
    setYImporting(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить песню?")) return
    await fetch(UPLOAD_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, id }),
    })
    await refreshSongs()
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">Администратор</h1>
            <p className="text-gray-400 text-sm mt-1">Управление песнями</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              className={inputCls}
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <motion.button
              onClick={handleAuth}
              disabled={loading || !password}
              className="w-full bg-cyan-500 text-slate-900 font-bold rounded-xl py-3 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Вход..." : "Войти"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8 pt-4">
          <Music size={28} className="text-cyan-400" />
          <h1 className="text-2xl font-bold">Управление песнями</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-gray-800 rounded-xl p-1">
          {([
            { id: "upload", label: "Загрузить MP3", icon: Upload },
            { id: "yandex", label: "Яндекс.Музыка", icon: Link },
          ] as { id: Tab; label: string; icon: typeof Upload }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === id ? "bg-cyan-500 text-slate-900" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-6 mb-6"
            >
              <h2 className="text-lg font-semibold mb-4 text-cyan-300">Загрузить MP3 файл</h2>
              <div className="space-y-3">
                <input placeholder="Название песни *" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Исполнитель" value={artist} onChange={(e) => setArtist(e.target.value)} className={inputCls} />
                  <input placeholder="Длительность (3:42)" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} />
                </div>
                <textarea
                  placeholder="Текст песни (необязательно)"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    file ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-400">{file ? file.name : "Нажмите чтобы выбрать MP3 файл"}</p>
                  {file && <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(1)} МБ</p>}
                  <input ref={fileRef} type="file" accept="audio/mpeg,audio/mp3,.mp3" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-gray-700">
                      <motion.div className="h-full rounded-full bg-cyan-500" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 text-center">{uploadProgress < 20 ? "Подготовка..." : uploadProgress < 95 ? `Загрузка ${uploadProgress}%` : "Завершение..."}</p>
                  </div>
                )}

                {uploadStatus !== "idle" && (
                  <div className={`flex items-center gap-2 text-sm ${uploadStatus === "ok" ? "text-green-400" : "text-red-400"}`}>
                    {uploadStatus === "ok" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {uploadMsg}
                  </div>
                )}

                <motion.button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full bg-cyan-500 text-slate-900 font-bold rounded-xl py-3 disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {uploading ? <><Loader size={18} className="animate-spin" /> Загружаю...</> : <><Upload size={18} /> Загрузить песню</>}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="yandex"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-6 mb-6"
            >
              <h2 className="text-lg font-semibold mb-1 text-cyan-300">Импорт из Яндекс.Музыки</h2>
              <p className="text-xs text-gray-500 mb-4">Вставьте ссылку вида: music.yandex.ru/album/123/track/456</p>
              <div className="space-y-3">
                <input
                  placeholder="Ссылка на трек *"
                  value={yUrl}
                  onChange={(e) => setYUrl(e.target.value)}
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Название (если отличается)" value={yTitle} onChange={(e) => setYTitle(e.target.value)} className={inputCls} />
                  <input placeholder="Исполнитель (если отличается)" value={yArtist} onChange={(e) => setYArtist(e.target.value)} className={inputCls} />
                </div>
                <textarea
                  placeholder="Текст песни (необязательно)"
                  value={yLyrics}
                  onChange={(e) => setYLyrics(e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />

                {yStatus !== "idle" && (
                  <div className={`flex items-start gap-2 text-sm ${yStatus === "ok" ? "text-green-400" : "text-red-400"}`}>
                    {yStatus === "ok" ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                    {yMsg}
                  </div>
                )}

                <motion.button
                  onClick={handleYandexImport}
                  disabled={yImporting}
                  className="w-full bg-cyan-500 text-slate-900 font-bold rounded-xl py-3 disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {yImporting ? <><Loader size={18} className="animate-spin" /> Импортирую...</> : <><Link size={18} /> Импортировать трек</>}
                </motion.button>

                <p className="text-xs text-gray-600 text-center">
                  Работает только с треками без DRM-защиты. Если не получается — загрузите MP3 вручную.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Songs List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-cyan-300">Загруженные песни ({songs.length})</h2>
          {songs.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">Пока нет загруженных песен</p>
          )}
          {songs.map((song) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{song.title}</p>
                <p className="text-sm text-gray-400">{song.artist}{song.duration ? ` · ${song.duration}` : ""}</p>
              </div>
              <motion.button
                onClick={() => handleDelete(song.id)}
                className="text-red-400 hover:text-red-300 p-2"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 size={18} />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
