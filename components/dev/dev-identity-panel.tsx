"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDevIdentityState,
  swapDevIdentity,
  resetDevIdentity,
  setDevDefaultProfile,
  searchDevProfiles,
  type DevIdentityState,
} from "@/lib/dev/actions";

type SearchResult = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};

export function DevIdentityPanel() {
  const router = useRouter();
  const [state, setState] = useState<DevIdentityState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const autoSwapDone = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadState = useCallback(async () => {
    const s = await getDevIdentityState();
    setState(s);
    setLoading(false);
    return s;
  }, []);

  // Load identity state on mount + auto-swap
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const s = await getDevIdentityState();
      if (cancelled) return;
      setState(s);
      setLoading(false);

      // Auto-swap if default is set and current profile doesn't match
      if (
        !autoSwapDone.current &&
        s &&
        !s.isSwapped &&
        s.defaultProfileUsername &&
        s.currentProfile &&
        s.currentProfile.username !== s.defaultProfileUsername
      ) {
        autoSwapDone.current = true;
        setSwapping(true);
        const profiles = await searchDevProfiles(s.defaultProfileUsername);
        const target = profiles.find(
          (p) => p.username === s.defaultProfileUsername
        );
        if (target && !cancelled) {
          const result = await swapDevIdentity(target.id);
          if (result.success && !cancelled) {
            const refreshed = await getDevIdentityState();
            if (!cancelled) setState(refreshed);
            router.refresh();
          }
        }
        if (!cancelled) setSwapping(false);
      } else {
        autoSwapDone.current = true;
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search via onChange
  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        const r = await searchDevProfiles(value);
        setResults(r);
        setSearching(false);
      }, 300);
    },
    []
  );

  if (loading || !state) {
    return null;
  }

  const handleSwap = async (profileId: string) => {
    setSwapping(true);
    const result = await swapDevIdentity(profileId);
    if (result.success) {
      await loadState();
      setQuery("");
      setResults([]);
      router.refresh();
    }
    setSwapping(false);
  };

  const handleReset = async () => {
    setSwapping(true);
    const result = await resetDevIdentity();
    if (result.success) {
      await loadState();
      router.refresh();
    }
    setSwapping(false);
  };

  const handleSetDefault = async () => {
    if (!state.currentProfile?.username) return;
    await setDevDefaultProfile(state.currentProfile.username);
    await loadState();
  };

  const handleClearDefault = async () => {
    await setDevDefaultProfile("");
    await loadState();
  };

  // Collapsed pill
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-amber-400/30 bg-neutral-950/95 px-3 py-1.5 shadow-lg backdrop-blur text-xs cursor-pointer hover:border-amber-400/50 transition-colors"
      >
        <span className="text-amber-400 font-mono font-bold">DEV</span>
        {swapping ? (
          <span className="text-neutral-400 animate-pulse">swapping...</span>
        ) : state.currentProfile ? (
          <span className="text-neutral-200 max-w-[120px] truncate">
            {state.currentProfile.username ?? state.currentProfile.displayName}
          </span>
        ) : (
          <span className="text-neutral-500">no profile</span>
        )}
        {state.isSwapped && (
          <span className="size-1.5 rounded-full bg-amber-400" />
        )}
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-amber-400/30 bg-neutral-950/95 shadow-lg backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-mono font-bold text-xs">
            DEV IDENTITY
          </span>
          {state.isSwapped && (
            <span className="text-[10px] text-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
              swapped
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-neutral-500 hover:text-neutral-300 text-lg leading-none cursor-pointer"
        >
          &times;
        </button>
      </div>

      {/* Current identity */}
      {state.currentProfile && (
        <div className="px-3 py-2.5 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            {state.currentProfile.avatarUrl ? (
              <img
                src={state.currentProfile.avatarUrl}
                alt=""
                className="size-8 rounded-full"
              />
            ) : (
              <div className="size-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 text-xs">
                {state.currentProfile.displayName[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm text-neutral-200 truncate">
                {state.currentProfile.displayName}
              </div>
              {state.currentProfile.username && (
                <div className="text-xs text-neutral-500 truncate">
                  @{state.currentProfile.username}
                </div>
              )}
            </div>
          </div>

          {/* Actions for current profile */}
          <div className="flex gap-2 mt-2">
            {state.currentProfile.username &&
              state.defaultProfileUsername !==
                state.currentProfile.username && (
                <button
                  onClick={handleSetDefault}
                  className="text-[11px] text-neutral-400 hover:text-amber-400 cursor-pointer transition-colors"
                >
                  Set as default
                </button>
              )}
            {state.defaultProfileUsername &&
              state.defaultProfileUsername ===
                state.currentProfile.username && (
                <span className="text-[11px] text-amber-400/60 flex items-center gap-1">
                  <span className="size-1 rounded-full bg-amber-400/60 inline-block" />
                  default
                  <button
                    onClick={handleClearDefault}
                    className="text-neutral-500 hover:text-neutral-300 ml-1 cursor-pointer"
                  >
                    (clear)
                  </button>
                </span>
              )}
            {state.isSwapped && (
              <button
                onClick={handleReset}
                disabled={swapping}
                className="text-[11px] text-neutral-400 hover:text-red-400 cursor-pointer transition-colors disabled:opacity-50 ml-auto"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="Search profiles..."
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400/40"
        />
      </div>

      {/* Results */}
      {(results.length > 0 || searching) && (
        <div className="px-1.5 pb-2 max-h-48 overflow-y-auto">
          {searching ? (
            <div className="text-xs text-neutral-500 px-2 py-2">
              Searching...
            </div>
          ) : (
            results.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSwap(profile.id)}
                disabled={
                  swapping || profile.id === state.currentProfile?.id
                }
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-neutral-800/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default text-left"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="size-6 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="size-6 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 text-[10px] flex-shrink-0">
                    {profile.displayName[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-neutral-200 truncate">
                    {profile.displayName}
                  </div>
                  {profile.username && (
                    <div className="text-[10px] text-neutral-500 truncate">
                      @{profile.username}
                    </div>
                  )}
                </div>
                {profile.id === state.currentProfile?.id && (
                  <span className="text-[10px] text-amber-400/60">
                    current
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Default info */}
      {state.defaultProfileUsername && !query && results.length === 0 && (
        <div className="px-3 pb-2">
          <div className="text-[10px] text-neutral-600">
            Auto-swaps to @{state.defaultProfileUsername} on load
          </div>
        </div>
      )}
    </div>
  );
}
