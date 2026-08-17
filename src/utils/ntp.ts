/**
 * NTP clock — server time from ntpjs.org, ported from daedalOS's Clock.
 * The offset between the NTP server and the local clock is measured once,
 * then re-polled every ~5 minutes, so `getNtpAdjustedTime()` stays drift-free
 * even while the tab runs in the background.
 */

type NTPResponse = {
  backoff?: number;
  now?: number;
  optout?: boolean;
};

const DEFAULT_BACKOFF_SECONDS = 300;
const HOUR_IN_SECONDS = 3600;
const MILLISECONDS_IN_SECOND = 1000;
const NTP_SERVER = "https://use.ntpjs.org/v1/time.json";

let msAheadBy: number | undefined;

const getNtpResponse = async (): Promise<NTPResponse> => {
  try {
    const response = await fetch(NTP_SERVER, {
      cache: "no-cache",
      credentials: "omit",
      keepalive: false,
      mode: "cors",
      referrerPolicy: "no-referrer",
    } as RequestInit);
    return (await response.json()) as NTPResponse;
  } catch {
    return {};
  }
};

const pollNtpTime = async (): Promise<void> => {
  const requestStartTime = Date.now();
  const { backoff = DEFAULT_BACKOFF_SECONDS, now = 0, optout = false } =
    await getNtpResponse();

  if (now) {
    msAheadBy = requestStartTime - Math.ceil(now * MILLISECONDS_IN_SECOND);
  }

  window.setTimeout(
    pollNtpTime,
    (optout ? HOUR_IN_SECONDS : backoff) * MILLISECONDS_IN_SECOND,
  );
};

/** The current time, adjusted to the NTP server (falls back to local). */
export const getNtpAdjustedTime = (): Date => {
  if (typeof msAheadBy !== "number") {
    msAheadBy = 0;
    pollNtpTime();
  }
  return new Date(Date.now() - msAheadBy);
};
