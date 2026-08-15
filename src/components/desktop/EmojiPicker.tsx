import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface EmojiPickerProps {
  onClose: () => void;
  onCopy: (emoji: string) => void;
}

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😋", "😛", "😝",
  "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😒", "😞",
  "😔", "😟", "😕", "😣", "😖", "😫", "😩", "🥺", "😢", "😭",
  "😤", "😠", "😡", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰",
  "😥", "😓", "🤗", "🤔", "🫡", "🫠", "🤭", "🫢", "🤫", "😶",
  "✌️", "🤞", "👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "👀",
  "🧠", "🫀", "🦾", "💻", "🖥️", "📱", "⌚", "🎧", "🖱️", "⌨️",
  "📷", "🎬", "🎵", "🎮", "🕹️", "⚽", "🏀", "🏆", "🚀", "🛸",
  "🌍", "🌙", "☀️", "⭐", "✨", "🔥", "⚡", "💡", "💰", "💎",
  "🎁", "🎉", "🎈", "❤️", "💔", "💯", "✅", "❌", "⚠️", "🚫",
  "♻️", "🔒", "🔓", "🔑", "📌", "📍", "📎", "✏️", "📝", "📄",
  "📁", "🗂️", "📅", "⏰", "🔔", "🎯", "🧩", "🍎", "🍕", "☕",
  "🍺", "🌮", "🍣", "🍩", "🍿", "🥑", "🌈", "🫧", "🧊", "🪄",
];

/** The macOS Emoji & Symbols picker (⌃⌘Space): a glass grid, click to copy. */
export default function EmojiPicker({ onClose, onCopy }: EmojiPickerProps) {
  return (
    <div className={styles.spotlightBackdrop} onClick={onClose}>
      <div className={styles.emojiPicker} onClick={(e) => e.stopPropagation()}>
        <div className={styles.emojiHeader}>
          <strong>Emoji &amp; Symbols</strong>
          <span className={styles.emojiCount}>{EMOJIS.length} characters</span>
        </div>
        <div className={styles.emojiGrid}>
          {EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              className={styles.emojiItem}
              onClick={() => onCopy(em)}
              aria-label={`Copy ${em}`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
