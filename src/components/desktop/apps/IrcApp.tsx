"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * IRC — KiwiIRC, the real web IRC client, ported from daedalOS. It is served
 * locally from /aryan/apps/kiwiirc and connects over WebSockets to Libera.Chat,
 * ErgoTestnet and InspIRCd's testnet (daedalOS's exact server list). The
 * network config is seeded into localStorage on first open, same as daedalOS.
 */

/** daedalOS's IRC server list — [name, server, (optional) port]. */
const IRC_SERVERS: [string, string, number?][] = [
  ["Libera.Chat", "web.libera.chat/webirc/websocket/"],
  ["ErgoTestnet", "testnet.ergo.chat/webirc"],
  ["InspIRCd Testnet", "testnet.inspircd.org", 8097],
];

const getNetworkConfig = (nickName: string): Record<string, unknown> => {
  const nick = `${nickName}${[9, 9, 9, 9]
    .map((x) => Math.floor(Math.random() * x))
    .join("")}`;
  return {
    networks: IRC_SERVERS.map(([name, server, port = 443], id) => ({
      buffers: [{ enabled: true, name: "*", settings: {} }],
      connection: { direct: true, encoding: "utf8", nick, port, server, tls: true },
      id: id + 1,
      name,
      settings: { show_raw_caps: false },
    })),
  };
};

export default function IrcApp() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Seed the network config once, like daedalOS.
  useEffect(() => {
    if (!window.localStorage.getItem("kiwiirc")) {
      window.localStorage.setItem("kiwiirc", JSON.stringify(getNetworkConfig("Guest")));
    }
  }, []);

  return (
    <div className={styles.irc}>
      {!loaded && (
        <div className={styles.ircLoading}>
          <span className={styles.gameSpin} style={{ display: "inline-block" }} />
          Connecting to IRC…
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/aryan/apps/kiwiirc/index.html"
        title="IRC"
        className={styles.ircFrame}
        onLoad={() => setLoaded(true)}
        sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
