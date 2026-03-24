import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Github, Twitter, Instagram, Linkedin, Mail, Globe, Coffee, Sun, Moon, Zap, Sparkles } from "lucide-react"

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
}> = {
  day: {
    name: "День",
    icon: Sun,
    bg: "bg-gray-50",
    cardBg: "bg-white",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    border: "border-gray-200",
    accent: "text-gray-900",
    buttonBg: "bg-gray-900",
    buttonText: "text-white",
    buttonHover: "hover:bg-gray-700",
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
  },
}

const socialLinks = [
  { name: "GitHub", icon: Github, url: "https://github.com", username: "@yourhandle" },
  { name: "Twitter", icon: Twitter, url: "https://twitter.com", username: "@yourhandle" },
  { name: "Instagram", icon: Instagram, url: "https://instagram.com", username: "@yourhandle" },
  { name: "LinkedIn", icon: Linkedin, url: "https://linkedin.com", username: "/in/yourprofile" },
  { name: "Почта", icon: Mail, url: "mailto:hello@example.com", username: "hello@example.com" },
  { name: "Сайт", icon: Globe, url: "https://example.com", username: "example.com" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
}

const linkVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.95,
  },
}

const themeButtonVariants = {
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.9,
    rotate: -5,
  },
}

export default function SocialLinksLanding() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("day")
  const theme = themes[currentTheme]

  return (
    <div className={`min-h-screen transition-all duration-500 ${theme.bg}`}>
      {/* Theme Switcher */}
      <motion.div
        className="fixed top-4 right-4 z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className={`flex gap-2 p-2 rounded-full ${theme.cardBg} ${theme.border} border-2`}>
          {Object.entries(themes).map(([key, themeData]) => {
            const IconComponent = themeData.icon
            return (
              <motion.button
                key={key}
                onClick={() => setCurrentTheme(key as Theme)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentTheme === key
                    ? `${theme.buttonBg} ${theme.buttonText}`
                    : `${theme.text} hover:${theme.buttonBg} hover:${theme.buttonText}`
                }`}
                variants={themeButtonVariants}
                whileHover="hover"
                whileTap="tap"
                title={themeData.name}
              >
                <IconComponent size={16} />
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
        {/* Profile Section */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <motion.div
            className={`w-24 h-24 mx-auto mb-6 rounded-full ${theme.cardBg} ${theme.border} border-4 flex items-center justify-center`}
            whileHover={{
              rotate: 360,
              transition: { duration: 0.5 },
            }}
          >
            <motion.div
              className={`w-16 h-16 rounded-full ${theme.buttonBg}`}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          <motion.h1 className={`text-3xl font-bold mb-2 ${theme.text}`} variants={itemVariants}>
            PixelLink
          </motion.h1>

          <motion.p className={`${theme.textSecondary} text-lg`} variants={itemVariants}>
            Все мои ссылки в одном месте
          </motion.p>
        </motion.div>

        {/* Social Links */}
        <motion.div className="space-y-4" variants={containerVariants}>
          <AnimatePresence>
            {socialLinks.map((link) => {
              const IconComponent = link.icon
              return (
                <motion.a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full p-4 rounded-lg ${theme.cardBg} ${theme.border} border-2 transition-all duration-200 group`}
                  variants={linkVariants}
                  whileHover="hover"
                  whileTap="tap"
                  layout
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className={`p-2 rounded-full ${theme.buttonBg} ${theme.buttonText}`}
                        whileHover={{ rotate: 15 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <IconComponent size={20} />
                      </motion.div>
                      <div>
                        <h3 className={`font-semibold ${theme.text}`}>{link.name}</h3>
                        <p className={`text-sm ${theme.textSecondary}`}>{link.username}</p>
                      </div>
                    </div>
                    <motion.div
                      className={`${theme.accent}`}
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <span className="text-xl">&rarr;</span>
                    </motion.div>
                  </div>
                </motion.a>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div className="text-center mt-12" variants={itemVariants}>
          <motion.p
            className={`text-sm ${theme.textSecondary}`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Сделано с заботой в PixelLink
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 ${theme.buttonBg} rounded-full opacity-20`}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
