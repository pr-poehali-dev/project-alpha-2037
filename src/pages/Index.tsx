import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Coffee, Zap, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, ChevronDown, ChevronUp, Loader } from "lucide-react"
import Icon from "@/components/ui/icon"

const SONGS_URL = "https://functions.poehali.dev/092ca65c-635c-495d-a7af-ad2980594837"

type Theme = "day" | "night" | "coffee" | "mint" | "electric"

const themes: Record<Theme, {
  name: string
  icon: typeof Sun
  bg: string
  cardBg: string
  text: string
  textSecondary: string
  border: string
  accent: string
  buttonBg: string
  buttonText: string
  progressBg: string
  progressFill: string
}> = {
  day: {
    name: "День", icon: Sun,
    bg: "bg-gray-50", cardBg: "bg-white",
    text: "text-gray-900", textSecondary: "text-gray-500",
    border: "border-gray-200", accent: "text-gray-900",
    buttonBg: "bg-gray-900", buttonText: "text-white",
    progressBg: "bg-gray-200", progressFill: "bg-gray-900",
  },
  night: {
    name: "Ночь", icon: Moon,
    bg: "bg-gray-900", cardBg: "bg-gray-800",
    text: "text-gray-100", textSecondary: "text-gray-400",
    border: "border-gray-700", accent: "text-gray-100",
    buttonBg: "bg-gray-100", buttonText: "text-gray-900",
    progressBg: "bg-gray-700", progressFill: "bg-gray-100",
  },
  coffee: {
    name: "Кофе", icon: Coffee,
    bg: "bg-amber-50", cardBg: "bg-amber-100",
    text: "text-amber-900", textSecondary: "text-amber-700",
    border: "border-amber-200", accent: "text-amber-800",
    buttonBg: "bg-amber-800", buttonText: "text-amber-50",
    progressBg: "bg-amber-200", progressFill: "bg-amber-800",
  },
  mint: {
    name: "Мята", icon: Sparkles,
    bg: "bg-emerald-50", cardBg: "bg-emerald-100",
    text: "text-emerald-900", textSecondary: "text-emerald-700",
    border: "border-emerald-200", accent: "text-emerald-800",
    buttonBg: "bg-emerald-800", buttonText: "text-emerald-50",
    progressBg: "bg-emerald-200", progressFill: "bg-emerald-800",
  },
  electric: {
    name: "Электро", icon: Zap,
    bg: "bg-slate-900", cardBg: "bg-slate-800",
    text: "text-cyan-100", textSecondary: "text-cyan-300",
    border: "border-cyan-500", accent: "text-cyan-400",
    buttonBg: "bg-cyan-500", buttonText: "text-slate-900",
    progressBg: "bg-slate-700", progressFill: "bg-cyan-500",
  },
}

interface Song {
  id: number
  title: string
  artist: string
  duration: string
  lyrics: string
  url: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } },
}
const themeButtonVariants = {
  hover: { scale: 1.1, rotate: 5, transition: { type: "spring", stiffness: 400, damping: 10 } },
  tap: { scale: 0.9, rotate: -5 },
}

export default function MusicPlayer() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("night")
  const theme = themes[currentTheme]

  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSong, setCurrentSong] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [openLyrics, setOpenLyrics] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch(SONGS_URL)
      .then((r) => r.json())
      .then((d) => { setSongs(d.songs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || songs.length === 0) return
    audio.src = songs[currentSong]?.url || ""
    audio.load()
    if (isPlaying) audio.play().catch(() => {})
  }, [currentSong, songs])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.play().catch(() => {}) } else { audio.pause() }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => setProgress((audio.currentTime / (audio.duration || 1)) * 100)
    const ended = () => { setCurrentSong((s) => (s + 1) % songs.length); setProgress(0) }
    audio.addEventListener("timeupdate", update)
    audio.addEventListener("ended", ended)
    return () => { audio.removeEventListener("timeupdate", update); audio.removeEventListener("ended", ended) }
  }, [songs])

  const handleNext = () => { setCurrentSong((s) => (s + 1) % songs.length); setProgress(0) }
  const handlePrev = () => { setCurrentSong((s) => (s - 1 + songs.length) % songs.length); setProgress(0) }

  const handleSongClick = (idx: number) => {
    if (idx === currentSong) { setIsPlaying(!isPlaying) }
    else { setCurrentSong(idx); setProgress(0); setIsPlaying(true) }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * audio.duration
    setProgress(pct * 100)
  }

  const toggleLyrics = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenLyrics((prev) => (prev === id ? null : id))
  }

  const song = songs[currentSong]

  return (
    <div className={`min-h-screen transition-all duration-500 ${theme.bg}`}>
      <audio ref={audioRef} />

      {/* Theme Switcher */}
      <motion.div
        className="fixed top-4 right-4 z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className={`flex gap-1 p-2 rounded-full ${theme.cardBg} ${theme.border} border-2`}>
          {Object.entries(themes).map(([key, themeData]) => {
            const IconComponent = themeData.icon
            return (
              <motion.button
                key={key}
                onClick={() => setCurrentTheme(key as Theme)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentTheme === key ? `${theme.buttonBg} ${theme.buttonText}` : `${theme.text}`
                }`}
                variants={themeButtonVariants}
                whileHover="hover"
                whileTap="tap"
                title={themeData.name}
              >
                <IconComponent size={14} />
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="container mx-auto px-4 py-16 max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile */}
        <motion.div className="text-center mb-10" variants={itemVariants}>
          <motion.div
            className={`w-24 h-24 mx-auto mb-5 rounded-full ${theme.cardBg} ${theme.border} border-4 flex items-center justify-center`}
            whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
          >
            <motion.div
              animate={{ scale: isPlaying ? [1, 1.15, 1] : 1 }}
              transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, ease: "easeInOut" }}
            >
              <Icon name="Music" size={36} className={theme.accent} />
            </motion.div>
          </motion.div>
          <motion.h1 className={`text-3xl font-bold mb-1 ${theme.text}`} variants={itemVariants}>
            Мои песни
          </motion.h1>
          <motion.p className={`${theme.textSecondary} text-base`} variants={itemVariants}>
            Слушай и читай тексты
          </motion.p>
        </motion.div>

        {loading ? (
          <motion.div className="flex justify-center py-20" variants={itemVariants}>
            <Loader size={32} className={`${theme.textSecondary} animate-spin`} />
          </motion.div>
        ) : songs.length === 0 ? (
          <motion.div
            className={`${theme.cardBg} ${theme.border} border-2 rounded-2xl p-12 text-center`}
            variants={itemVariants}
          >
            <Icon name="Music" size={40} className={`${theme.textSecondary} mx-auto mb-3`} />
            <p className={`${theme.textSecondary}`}>Песни ещё не загружены</p>
          </motion.div>
        ) : (
          <>
            {/* Player Card */}
            <motion.div className={`${theme.cardBg} ${theme.border} border-2 rounded-2xl p-6 mb-6`} variants={itemVariants}>
              <div className="text-center mb-5">
                <motion.p key={currentSong} className={`text-xs uppercase tracking-widest ${theme.textSecondary} mb-1`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Сейчас играет
                </motion.p>
                <motion.h2 key={`t-${currentSong}`} className={`text-xl font-bold ${theme.text}`} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                  {song?.title}
                </motion.h2>
                {song?.artist && <p className={`text-sm ${theme.textSecondary} mt-0.5`}>{song.artist}</p>}
              </div>

              <div className={`w-full h-1.5 rounded-full ${theme.progressBg} mb-5 cursor-pointer`} onClick={handleSeek}>
                <motion.div className={`h-full rounded-full ${theme.progressFill}`} style={{ width: `${progress}%` }} />
              </div>

              <div className="flex items-center justify-center gap-6">
                <motion.button onClick={handlePrev} className={`${theme.text} opacity-70 hover:opacity-100`} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  <SkipBack size={22} />
                </motion.button>
                <motion.button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-14 h-14 rounded-full ${theme.buttonBg} ${theme.buttonText} flex items-center justify-center shadow-lg`}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                </motion.button>
                <motion.button onClick={handleNext} className={`${theme.text} opacity-70 hover:opacity-100`} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  <SkipForward size={22} />
                </motion.button>
              </div>
            </motion.div>

            {/* Songs List */}
            <motion.div className="space-y-3" variants={containerVariants}>
              {songs.map((s, idx) => (
                <motion.div key={s.id} className={`${theme.cardBg} ${theme.border} border-2 rounded-xl overflow-hidden`} variants={itemVariants} layout>
                  <motion.button className="w-full p-4 flex items-center justify-between text-left" onClick={() => handleSongClick(idx)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${currentSong === idx ? `${theme.buttonBg} ${theme.buttonText}` : theme.progressBg}`}
                        animate={currentSong === idx && isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                        transition={{ duration: 0.8, repeat: currentSong === idx && isPlaying ? Infinity : 0 }}
                      >
                        {currentSong === idx && isPlaying ? <Volume2 size={14} /> : <Play size={13} className="ml-0.5" />}
                      </motion.div>
                      <div>
                        <p className={`font-semibold text-sm ${theme.text}`}>{s.title}</p>
                        <p className={`text-xs ${theme.textSecondary}`}>{s.artist || s.duration}</p>
                      </div>
                    </div>
                    {s.lyrics && (
                      <motion.button
                        onClick={(e) => toggleLyrics(s.id, e)}
                        className={`text-xs flex items-center gap-1 px-3 py-1 rounded-full border ${theme.border} ${theme.textSecondary}`}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      >
                        Текст
                        {openLyrics === s.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </motion.button>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {openLyrics === s.id && s.lyrics && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className={`px-4 pb-4 pt-0 border-t ${theme.border}`}>
                          <p className={`text-sm leading-7 whitespace-pre-line ${theme.textSecondary} pt-3`}>{s.lyrics}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

        <motion.p className={`text-center text-xs ${theme.textSecondary} mt-10 opacity-50`} variants={itemVariants}>
          © 2026 · Все права защищены
        </motion.p>
      </motion.div>
    </div>
  )
}
