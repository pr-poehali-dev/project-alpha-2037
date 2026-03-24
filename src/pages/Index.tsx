import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Coffee, Zap, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, Music, ChevronDown, ChevronUp } from "lucide-react"
import Icon from "@/components/ui/icon"

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
  buttonHover: string
  progressBg: string
  progressFill: string
}> = {
  day: {
    name: "День",
    icon: Sun,
    bg: "bg-gray-50",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-500",
    border: "border-gray-200",
    accent: "text-gray-900",
    buttonBg: "bg-gray-900",
    buttonText: "text-white",
    buttonHover: "hover:bg-gray-700",
    progressBg: "bg-gray-200",
    progressFill: "bg-gray-900",
  },
  night: {
    name: "Ночь",
    icon: Moon,
    bg: "bg-gray-900",
    cardBg: "bg-gray-800",
    text: "text-gray-100",
    textSecondary: "text-gray-400",
    border: "border-gray-700",
    accent: "text-gray-100",
    buttonBg: "bg-gray-100",
    buttonText: "text-gray-900",
    buttonHover: "hover:bg-gray-300",
    progressBg: "bg-gray-700",
    progressFill: "bg-gray-100",
  },
  coffee: {
    name: "Кофе",
    icon: Coffee,
    bg: "bg-amber-50",
    cardBg: "bg-amber-100",
    text: "text-amber-900",
    textSecondary: "text-amber-700",
    border: "border-amber-200",
    accent: "text-amber-800",
    buttonBg: "bg-amber-800",
    buttonText: "text-amber-50",
    buttonHover: "hover:bg-amber-700",
    progressBg: "bg-amber-200",
    progressFill: "bg-amber-800",
  },
  mint: {
    name: "Мята",
    icon: Sparkles,
    bg: "bg-emerald-50",
    cardBg: "bg-emerald-100",
    text: "text-emerald-900",
    textSecondary: "text-emerald-700",
    border: "border-emerald-200",
    accent: "text-emerald-800",
    buttonBg: "bg-emerald-800",
    buttonText: "text-emerald-50",
    buttonHover: "hover:bg-emerald-700",
    progressBg: "bg-emerald-200",
    progressFill: "bg-emerald-800",
  },
  electric: {
    name: "Электро",
    icon: Zap,
    bg: "bg-slate-900",
    cardBg: "bg-slate-800",
    text: "text-cyan-100",
    textSecondary: "text-cyan-300",
    border: "border-cyan-500",
    accent: "text-cyan-400",
    buttonBg: "bg-cyan-500",
    buttonText: "text-slate-900",
    buttonHover: "hover:bg-cyan-400",
    progressBg: "bg-slate-700",
    progressFill: "bg-cyan-500",
  },
}

interface Song {
  id: number
  title: string
  duration: string
  lyrics: string
}

const songs: Song[] = [
  {
    id: 1,
    title: "Первая песня",
    duration: "3:42",
    lyrics: `Здесь будут слова первой песни
Строка за строкой, куплет за куплетом
Замените этот текст на настоящий
И музыка оживёт`,
  },
  {
    id: 2,
    title: "Вторая песня",
    duration: "4:10",
    lyrics: `Слова второй песни живут здесь
В ритме и в рифме, в тишине и в огне
Каждое слово — это часть истории
Которую я хочу рассказать тебе`,
  },
  {
    id: 3,
    title: "Третья песня",
    duration: "3:55",
    lyrics: `Третья песня — самая особенная
Она про то, что важно и близко
Строки складываются в мелодию
И мелодия становится жизнью`,
  },
  {
    id: 4,
    title: "Четвёртая песня",
    duration: "4:28",
    lyrics: `Четыре аккорда, четыре слова
Четыре момента из прошлого
Всё это складывается в песню
Которая звучит для тебя`,
  },
  {
    id: 5,
    title: "Пятая песня",
    duration: "3:20",
    lyrics: `И снова начало, снова мотив
Снова я здесь с новой песней
Пусть эти слова найдут тебя
Где бы ты ни был сейчас`,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 10 },
  },
}

const themeButtonVariants = {
  hover: { scale: 1.1, rotate: 5, transition: { type: "spring", stiffness: 400, damping: 10 } },
  tap: { scale: 0.9, rotate: -5 },
}

export default function MusicPlayer() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("night")
  const theme = themes[currentTheme]

  const [currentSong, setCurrentSong] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [openLyrics, setOpenLyrics] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            handleNext()
            return 0
          }
          return p + 0.3
        })
      }, 100)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, currentSong])

  const handleNext = () => {
    setCurrentSong((s) => (s + 1) % songs.length)
    setProgress(0)
  }

  const handlePrev = () => {
    setCurrentSong((s) => (s - 1 + songs.length) % songs.length)
    setProgress(0)
  }

  const handleSongClick = (idx: number) => {
    setCurrentSong(idx)
    setProgress(0)
    setIsPlaying(true)
  }

  const toggleLyrics = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenLyrics((prev) => (prev === id ? null : id))
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${theme.bg}`}>
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
                  currentTheme === key
                    ? `${theme.buttonBg} ${theme.buttonText}`
                    : `${theme.text}`
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

        {/* Player Card */}
        <motion.div
          className={`${theme.cardBg} ${theme.border} border-2 rounded-2xl p-6 mb-6`}
          variants={itemVariants}
        >
          {/* Now Playing */}
          <div className="text-center mb-5">
            <motion.p
              key={currentSong}
              className={`text-xs uppercase tracking-widest ${theme.textSecondary} mb-1`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Сейчас играет
            </motion.p>
            <motion.h2
              key={`title-${currentSong}`}
              className={`text-xl font-bold ${theme.text}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {songs[currentSong].title}
            </motion.h2>
          </div>

          {/* Progress Bar */}
          <div className={`w-full h-1.5 rounded-full ${theme.progressBg} mb-5 cursor-pointer`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              setProgress((x / rect.width) * 100)
            }}
          >
            <motion.div
              className={`h-full rounded-full ${theme.progressFill}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <motion.button
              onClick={handlePrev}
              className={`${theme.text} opacity-70 hover:opacity-100`}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipBack size={22} />
            </motion.button>

            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-14 h-14 rounded-full ${theme.buttonBg} ${theme.buttonText} flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </motion.button>

            <motion.button
              onClick={handleNext}
              className={`${theme.text} opacity-70 hover:opacity-100`}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <SkipForward size={22} />
            </motion.button>
          </div>
        </motion.div>

        {/* Songs List */}
        <motion.div className="space-y-3" variants={containerVariants}>
          {songs.map((song, idx) => (
            <motion.div
              key={song.id}
              className={`${theme.cardBg} ${theme.border} border-2 rounded-xl overflow-hidden`}
              variants={itemVariants}
              layout
            >
              {/* Song Row */}
              <motion.button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => handleSongClick(idx)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      currentSong === idx ? `${theme.buttonBg} ${theme.buttonText}` : `${theme.progressBg}`
                    }`}
                    animate={currentSong === idx && isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.8, repeat: currentSong === idx && isPlaying ? Infinity : 0 }}
                  >
                    {currentSong === idx && isPlaying ? (
                      <Volume2 size={14} />
                    ) : (
                      <Play size={13} className="ml-0.5" />
                    )}
                  </motion.div>
                  <div>
                    <p className={`font-semibold text-sm ${theme.text}`}>{song.title}</p>
                    <p className={`text-xs ${theme.textSecondary}`}>{song.duration}</p>
                  </div>
                </div>

                <motion.button
                  onClick={(e) => toggleLyrics(song.id, e)}
                  className={`text-xs flex items-center gap-1 px-3 py-1 rounded-full border ${theme.border} ${theme.textSecondary}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Текст
                  {openLyrics === song.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </motion.button>
              </motion.button>

              {/* Lyrics */}
              <AnimatePresence>
                {openLyrics === song.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className={`px-4 pb-4 pt-0 border-t ${theme.border}`}>
                      <p className={`text-sm leading-7 whitespace-pre-line ${theme.textSecondary} pt-3`}>
                        {song.lyrics}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          className={`text-center text-xs ${theme.textSecondary} mt-10 opacity-50`}
          variants={itemVariants}
        >
          © 2026 · Все права защищены
        </motion.p>
      </motion.div>
    </div>
  )
}
