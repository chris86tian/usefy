"use client";
import { useCodeEditorStore } from "@/hooks/useCodeEditorStore";
import { useEffect, useRef, useState } from "react";
import { LANGUAGE_CONFIG } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronDownIcon } from "lucide-react";
import useMounted from "@/hooks/useMounted";

interface LanguageSelectorProps {
  assignment: Assignment;
}

function LanguageSelector({ assignment }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useMounted();

  const { language, setLanguage } = useCodeEditorStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    language.toLowerCase() in LANGUAGE_CONFIG
      ? language.toLowerCase()
      : "python";
  const currentLanguageObj = LANGUAGE_CONFIG[currentLanguage];

  useEffect(() => {
    const assignmentLanguage = assignment.language?.toLowerCase();
    if (assignmentLanguage && assignmentLanguage in LANGUAGE_CONFIG) {
      setLanguage(assignmentLanguage);
    } else {
      setLanguage("python");
    }
  }, [assignment.language, setLanguage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = (langId: string) => {
    if (langId in LANGUAGE_CONFIG) {
      setLanguage(langId);
      setIsOpen(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-3 px-4 py-2.5 bg-background/80 
      rounded-lg transition-all duration-200 border border-border hover:border-border/80"
      >
        {/* Decoration */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/5 
        rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />

        <div className="size-6 rounded-md bg-muted p-0.5 group-hover:scale-110 transition-transform">
          <Image
            src={currentLanguageObj.logoPath || "/placeholder.svg"}
            alt="programming language logo"
            width={24}
            height={24}
            className="w-full h-full object-contain relative z-10"
          />
        </div>

        <span className="text-foreground/90 min-w-[80px] text-left group-hover:text-foreground transition-colors">
          {currentLanguageObj.label}
        </span>

        <ChevronDownIcon
          className={`size-4 text-muted-foreground transition-all duration-300 group-hover:text-muted-foreground/80
            ${isOpen ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-background/95 backdrop-blur-xl
           rounded-xl border border-border shadow-2xl py-2 z-50"
          >
            <div className="px-3 pb-2 mb-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground">
                Select Language
              </p>
            </div>

            <div className="max-h-[280px] overflow-y-auto overflow-x-hidden">
              {Object.values(LANGUAGE_CONFIG).map((lang, index) => {
                const isDisabled =
                  lang.id !== assignment.language?.toLowerCase();

                return (
                  <motion.div
                    key={lang.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group px-2"
                  >
                    <button
                      disabled={isDisabled}
                      className={`
                      relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${currentLanguage === lang.id ? "bg-primary/10 text-primary" : "text-foreground/80"}
                      ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                      onClick={() => handleLanguageSelect(lang.id)}
                    >
                      {/* decorator */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg 
                      opacity-0 group-hover:opacity-100 transition-opacity ${isDisabled ? "!opacity-0" : ""}`}
                      />

                      <div
                        className={`
                         relative size-8 rounded-lg p-1.5 group-hover:scale-110 transition-transform
                         ${currentLanguage === lang.id ? "bg-primary/10" : "bg-muted"}
                         ${isDisabled ? "!scale-100" : ""}
                       `}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg 
                        opacity-0 group-hover:opacity-100 transition-opacity ${isDisabled ? "!opacity-0" : ""}`}
                        />
                        <Image
                          width={24}
                          height={24}
                          src={lang.logoPath || "/placeholder.svg"}
                          alt={`${lang.label} logo`}
                          className="w-full h-full object-contain relative z-10"
                        />
                      </div>

                      <span className="flex-1 text-left group-hover:text-foreground transition-colors">
                        {lang.label}
                      </span>

                      {/* selected language border */}
                      {currentLanguage === lang.id && (
                        <motion.div
                          className="absolute inset-0 border-2 border-primary/30 rounded-lg"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageSelector;
