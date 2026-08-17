"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Event as NostrEvent,
  Relay,
  generatePrivateKey,
  getEventHash,
  getPublicKey,
  getSignature,
  nip04,
  nip19,
  relayInit,
  validateEvent,
  verifySignature,
} from "nostr-tools";
import { sounds } from "@/utils/sounds";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Messenger — encrypted direct messaging over the Nostr protocol, ported from
 * daedalOS. Messages are NIP-04 AES-GCM encrypted end-to-end: your keypair is
 * generated on first launch and stored locally, and nobody but the recipient
 * can read the chat. Uses daedalOS's exact relay list (nos.lol, nostr.mom,
 * public.relaying.io, nostrchat, relayable) and profile/metadata handling.
 */

const RELAYS = [
  "wss://nos.lol",
  "wss://nostr.mom",
  "wss://public.relaying.io",
  "wss://relay1.nostrchat.io",
  "wss://relayable.org",
];

const METADATA_KIND = 0;
const DM_KIND = 4;

const PRIVATE_KEY_STORAGE = "aryanos.nostr.private";
const PUBLIC_KEY_STORAGE = "aryanos.nostr.public";
const CONTACTS_STORAGE = "aryanos.nostr.contacts";

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

interface Profile {
  userName: string;
  picture?: string;
  about?: string;
  nip05?: string;
  display_name?: string;
  name?: string;
  username?: string;
}

interface Contact {
  pubkey: string;
  lastMessage?: number;
}

const loadKey = (key: string): string => {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const saveKey = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Best effort
  }
};

const loadContacts = (): Contact[] => {
  try {
    return JSON.parse(
      window.localStorage.getItem(CONTACTS_STORAGE) || "[]",
    ) as Contact[];
  } catch {
    return [];
  }
};

const saveContacts = (contacts: Contact[]) => {
  try {
    window.localStorage.setItem(CONTACTS_STORAGE, JSON.stringify(contacts));
  } catch {
    // Best effort
  }
};

const toHexKey = (key: string): string => {
  if (key.startsWith("nprofile") || key.startsWith("npub") || key.startsWith("nsec")) {
    try {
      const { data } = nip19.decode(key);
      if (typeof data === "string") return data;
      if (typeof data === "object" && "pubkey" in data) {
        return (data as { pubkey: string }).pubkey;
      }
    } catch {
      return key;
    }
  }
  return key;
};

const getOrCreateKeypair = (): { pubkey: string; privkey: string } => {
  let privkey = loadKey(PRIVATE_KEY_STORAGE);
  let pubkey = loadKey(PUBLIC_KEY_STORAGE);
  if (!privkey || !pubkey) {
    privkey = generatePrivateKey();
    pubkey = getPublicKey(privkey);
    saveKey(PRIVATE_KEY_STORAGE, privkey);
    saveKey(PUBLIC_KEY_STORAGE, pubkey);
  }
  return { pubkey, privkey };
};

const shortTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 1) return `${minutes}m`;
  const days = Math.floor(hours / 24);
  if (days < 1) return `${hours}h`;
  const weeks = Math.floor(days / 7);
  if (weeks < 1) return `${days}d`;
  return `${weeks}w`;
};

const prettyTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  ).getTime();
  const t = date.getTime();
  const pretty = date.toLocaleString("en-US", TIME_FORMAT);
  if (t > today) return pretty;
  if (t > yesterday) return `Yesterday at ${pretty}`;
  if (t > today - 6 * 86400000) {
    return date.toLocaleString("en-US", { ...TIME_FORMAT, weekday: "long" });
  }
  return date.toLocaleString("en-US", {
    ...TIME_FORMAT,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/** Group messages into day-bubbles (daedalOS groupChatEvents). */
const groupByTime = (
  events: NostrEvent[],
): { label: string; events: NostrEvent[] }[] => {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => a.created_at - b.created_at);
  const groups: { label: string; events: NostrEvent[] }[] = [
    { label: prettyTime(sorted[0].created_at), events: [sorted[0]] },
  ];
  for (const event of sorted.slice(1)) {
    const lastGroup = groups[groups.length - 1];
    const lastEvent = lastGroup.events[lastGroup.events.length - 1];
    if (Math.abs(event.created_at - lastEvent.created_at) < 1800) {
      lastGroup.events.push(event);
    } else {
      groups.push({ label: prettyTime(event.created_at), events: [event] });
    }
  }
  return groups;
};

export default function MessengerApp() {
  const { pubkey, privkey } = useMemo(getOrCreateKeypair, []);
  const [relays, setRelays] = useState<Relay[]>([]);
  const [contacts, setContacts] = useState<Contact[]>(loadContacts);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, NostrEvent[]>>({});
  const [draft, setDraft] = useState("");
  const [toInput, setToInput] = useState("");
  const [status, setStatus] = useState("Connecting to relays…");
  const [unread, setUnread] = useState<Record<string, number>>({});
  const eventsRef = useRef<Record<string, NostrEvent[]>>({});
  const connectedRef = useRef(false);

  /** Connect to the relay pool (daedalOS connectToRelays). */
  useEffect(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;
    const pool = RELAYS.map((url) => relayInit(url));
    let connectedCount = 0;
    pool.forEach((relay) => {
      relay.on("connect", () => {
        connectedCount += 1;
        setStatus(`Connected to ${connectedCount}/${pool.length} relays`);
        // Subscribe to DMs (both directions) + a slice of profile metadata.
        const sub = relay.sub([
          { kinds: [METADATA_KIND], limit: 200 },
          { kinds: [DM_KIND], authors: [pubkey] },
          { kinds: [DM_KIND], "#p": [pubkey] },
        ]);
        sub.on("event", (event) => handleIncoming(event));
      });
      relay.on("error", () => {
        setStatus("Some relays unavailable");
      });
      relay.connect().catch(() => {
        /* relay unreachable */
      });
    });
    setRelays(pool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkey]);

  /** Route an incoming event: metadata → profile, DM → decrypted chat. */
  const handleIncoming = useCallback(
    (event: NostrEvent) => {
      if (event.kind === METADATA_KIND) {
        try {
          const data = JSON.parse(event.content) as Profile;
          setProfiles((p) => ({
            ...p,
            [event.pubkey]: {
              userName: data.display_name || data.name || data.username || event.pubkey.slice(0, 12),
              picture: data.picture,
              about: data.about,
              nip05: data.nip05,
            },
          }));
        } catch {
          // Malformed metadata
        }
        return;
      }
      if (event.kind !== DM_KIND) return;
      const other = event.pubkey === pubkey ? getTagKey(event) : event.pubkey;
      if (!other) return;

      setMessages((prev) => {
        const existing = eventsRef.current[other] || [];
        if (existing.some((e) => e.id === event.id)) return prev;
        const next = [...existing, event];
        eventsRef.current = { ...eventsRef.current, [other]: next };
        return { ...eventsRef.current };
      });

      // Track unread for non-active chats.
      setUnread((u) => {
        if (activeRef.current === other) return u;
        return { ...u, [other]: (u[other] || 0) + 1 };
      });

      setContacts((c) => {
        const existing = c.find((x) => x.pubkey === other);
        const next = existing
          ? c.map((x) =>
              x.pubkey === other
                ? { ...x, lastMessage: event.created_at }
                : x,
            )
          : [{ pubkey: other, lastMessage: event.created_at }, ...c];
        saveContacts(next);
        return next;
      });
    },
    [pubkey],
  );

  const activeRef = useRef<string | null>(null);
  activeRef.current = activeKey;

  const getTagKey = (event: NostrEvent): string => {
    const [, key = ""] = event.tags.find(([tag]) => tag === "p") || [];
    return key;
  };

  /** Decrypt a DM (NIP-04) with our private key. */
  const decrypt = async (event: NostrEvent): Promise<string> => {
    const sender = event.pubkey === pubkey ? getTagKey(event) : event.pubkey;
    if (!sender) return "";
    try {
      return await nip04.decrypt(privkey, sender, event.content);
    } catch {
      return "";
    }
  };

  /** Encrypt + publish a DM (daedalOS createMessageEvent). */
  const sendMessage = async () => {
    const recipient = activeKey || toHexKey(toInput.trim());
    const text = draft.trim();
    if (!recipient || !text) return;
    try {
      const encrypted = await nip04.encrypt(privkey, recipient, text);
      const event: NostrEvent = {
        kind: DM_KIND,
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", recipient]],
        content: encrypted,
        id: "",
        sig: "",
      };
      event.id = getEventHash(event);
      event.sig = getSignature(event, privkey);
      if (!validateEvent(event) || !verifySignature(event)) return;
      relays.forEach((relay) => {
        // status 1 = WebSocket.OPEN (nostr-tools v1 Relay.status).
        if (relay.status === 1) {
          relay.publish(event).catch(() => undefined);
        }
      });
      // Optimistic local echo.
      handleIncoming(event);
      setDraft("");
      if (!activeKey) {
        setContacts((c) => {
          const next = [{ pubkey: recipient, lastMessage: event.created_at }, ...c];
          saveContacts(next);
          return next;
        });
        setActiveKey(recipient);
      }
      sounds.pop();
    } catch {
      /* encryption failed */
    }
  };

  /** Load full message history for the active contact. */
  const loadHistory = (other: string) => {
    if (!other || messages[other]) return;
    relays.forEach((relay) => {
      if (relay.status !== 1) return;
      const sub = relay.sub([
        { kinds: [DM_KIND], authors: [pubkey], "#p": [other] },
        { kinds: [DM_KIND], authors: [other], "#p": [pubkey] },
      ]);
      sub.on("event", (event) => handleIncoming(event));
    });
  };

  useEffect(() => {
    if (activeKey) loadHistory(activeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const activeMessages = activeKey ? messages[activeKey] || [] : [];
  const groups = useMemo(() => groupByTime(activeMessages), [activeMessages]);

  const copyNpub = () => {
    void navigator.clipboard?.writeText(nip19.npubEncode(pubkey));
  };

  return (
    <div className={styles.messenger}>
      {/* contacts sidebar */}
      <div className={styles.messengerContacts}>
        <div className={styles.messengerHeader}>
          <strong>Messenger</strong>
          <span className={styles.messengerStatus} title="Relay status">
            <span className={styles.messengerDot} />
            {status}
          </span>
        </div>
        <div className={styles.messengerProfileRow}>
          <span className={styles.messengerAvatar}>
            {(profiles[pubkey]?.picture && (
              <img
                src={profiles[pubkey]!.picture}
                alt=""
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )) || <span className={styles.messengerInitial}>{"👤"}</span>}
          </span>
          <div className={styles.messengerProfileInfo}>
            <strong>{profiles[pubkey]?.userName || "You"}</strong>
            <button type="button" className={styles.messengerCopy} onClick={copyNpub}>
              Copy npub address
            </button>
          </div>
        </div>
        <div className={styles.messengerTo}>
          <input
            className={styles.messengerInput}
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && toInput.trim()) {
                setActiveKey(toHexKey(toInput.trim()));
                setToInput("");
              }
            }}
            placeholder="Start chat with npub / nprofile…"
            spellCheck={false}
            aria-label="Start chat with pubkey"
          />
        </div>
        <div className={styles.messengerContactList}>
          {contacts.map((contact) => {
            const profile = profiles[contact.pubkey];
            const active = activeKey === contact.pubkey;
            return (
              <button
                key={contact.pubkey}
                type="button"
                className={`${styles.messengerContact} ${
                  active ? styles.messengerContactActive : ""
                }`}
                onClick={() => setActiveKey(contact.pubkey)}
              >
                <span className={styles.messengerAvatar}>
                  {profile?.picture ? (
                    <img
                      src={profile.picture}
                      alt=""
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  ) : (
                    <span className={styles.messengerInitial}>
                      {(profile?.userName || contact.pubkey)[0]?.toUpperCase()}
                    </span>
                  )}
                </span>
                <span className={styles.messengerContactText}>
                  <strong>{profile?.userName || contact.pubkey.slice(0, 12)}</strong>
                  {contact.lastMessage && (
                    <span>{shortTime(contact.lastMessage)}</span>
                  )}
                </span>
                {unread[contact.pubkey] ? (
                  <span className={styles.messengerUnread}>
                    {unread[contact.pubkey]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* chat pane */}
      <div className={styles.messengerChat}>
        {activeKey ? (
          <>
            <div className={styles.messengerChatHeader}>
              <strong>
                {profiles[activeKey]?.userName || activeKey.slice(0, 16)}…
              </strong>
              <span className={styles.messengerChatHint}>
                {profiles[activeKey]?.about || "Encrypted direct message (NIP-04)"}
              </span>
            </div>
            <div className={styles.messengerLog}>
              {groups.length === 0 && (
                <p className={styles.messengerEmpty}>
                  No messages yet. Say hello — it&apos;s end-to-end encrypted.
                </p>
              )}
              {groups.map((group) => (
                <div key={group.label} className={styles.messengerDay}>
                  <span className={styles.messengerDayLabel}>{group.label}</span>
                  {group.events.map((event) => (
                    <Bubble
                      key={event.id}
                      event={event}
                      mine={event.pubkey === pubkey}
                      decrypt={decrypt}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.messengerComposer}>
              <input
                className={styles.messengerInput}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void sendMessage();
                }}
                placeholder="Encrypted message…"
                spellCheck={false}
                aria-label="Message"
              />
              <button
                type="button"
                className={styles.messengerSend}
                onClick={() => void sendMessage()}
                disabled={!draft.trim()}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.messengerEmptyPane}>
            <span className={styles.messengerEmptyIcon}>💬</span>
            <strong>Encrypted Messenger</strong>
            <p>
              Your keypair was generated locally. Paste someone&apos;s npub above,
              or wait for a contact to message you. All messages are NIP-04
              end-to-end encrypted.
            </p>
            <span className={styles.messengerKeyHint}>{pubkey.slice(0, 20)}…</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** One message bubble — decrypts asynchronously and renders. */
function Bubble({
  event,
  mine,
  decrypt,
}: {
  event: NostrEvent;
  mine: boolean;
  decrypt: (e: NostrEvent) => Promise<string>;
}) {
  const [text, setText] = useState("…");
  useEffect(() => {
    let cancelled = false;
    void decrypt(event).then((t) => {
      if (!cancelled) setText(t || "🔒 Undecryptable");
    });
    return () => {
      cancelled = true;
    };
  }, [decrypt, event]);
  const time = new Date(event.created_at * 1000).toLocaleString("en-US", TIME_FORMAT);

  return (
    <div
      className={`${styles.messengerBubble} ${
        mine ? styles.messengerBubbleMine : ""
      }`}
    >
      <p>{text}</p>
      <span>{time}</span>
    </div>
  );
}
