export function LostStarIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.90722 0.693078C3.87924 0.710448 3.85668 0.735291 3.84207 0.764806L3.07241 2.32453C3.02165 2.42729 2.94667 2.51618 2.85394 2.58354C2.76121 2.6509 2.6535 2.69471 2.54008 2.71121L0.818436 2.96289C0.78567 2.96752 0.754865 2.98127 0.729529 3.00255C0.704192 3.02384 0.685344 3.05181 0.67513 3.08329C0.664916 3.11477 0.663748 3.14848 0.671758 3.18059C0.679768 3.2127 0.696635 3.24191 0.720437 3.2649L1.96576 4.47728C2.04796 4.55734 2.10945 4.65619 2.14493 4.76531C2.18042 4.87443 2.18882 4.99055 2.16942 5.10364L1.87576 6.8167C1.87004 6.84927 1.87358 6.88279 1.88598 6.91345C1.89837 6.94411 1.91911 6.97067 1.94586 6.99012C1.9726 7.00957 2.00426 7.02112 2.03724 7.02346C2.07022 7.02581 2.1032 7.01885 2.13242 7.00338L3.67141 6.19401C3.77283 6.14075 3.88568 6.11293 4.00024 6.11293C4.11479 6.11293 4.22764 6.14075 4.32907 6.19401L5.86838 7.00338C5.89762 7.01894 5.93063 7.02598 5.96367 7.02368C5.99671 7.02138 6.02844 7.00984 6.05523 6.99038C6.08203 6.97091 6.10281 6.94431 6.11521 6.9136C6.12762 6.88289 6.13114 6.84932 6.12538 6.8167L5.83138 5.10331C5.81207 4.99026 5.82052 4.87422 5.856 4.76517C5.89147 4.65612 5.95292 4.55732 6.03505 4.47728L7.28037 3.26457C7.30398 3.24155 7.32067 3.21239 7.32856 3.18038C7.33646 3.14837 7.33524 3.11478 7.32504 3.08343C7.31485 3.05208 7.29608 3.0242 7.27087 3.00296C7.24565 2.98171 7.215 2.96795 7.18237 2.96322L5.46039 2.71121C5.3471 2.69458 5.23954 2.65071 5.14693 2.58336C5.05433 2.51601 4.97945 2.42719 4.92873 2.32453L4.15874 0.764806C4.14413 0.735291 4.12156 0.710448 4.09358 0.693078C4.06561 0.675708 4.03333 0.666504 4.0004 0.666504C3.96747 0.666504 3.9352 0.675708 3.90722 0.693078Z"
        stroke="var(--am-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TerminalWindow() {
  return (
    <div className="flex w-full max-w-[420px] flex-col items-start justify-start gap-3 overflow-hidden rounded-none border border-[var(--am-border)] bg-[var(--am-surface)] p-4 sm:max-w-[460px] sm:gap-3.5 sm:p-5">
      <div className="inline-flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] font-normal text-[var(--am-accent)] sm:text-[11px]">
            SYSTEM://LOST_STAR.sh
          </span>
          <span className="relative inline-flex items-center justify-center text-[var(--am-accent)]" aria-hidden="true">
            <LostStarIcon />
          </span>
        </div>
        <div aria-hidden="true">
          <svg width="20" height="8" viewBox="0 0 20 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="8" height="8" fill="#EF4444" />
            <rect x="12" width="8" height="8" fill="var(--am-border)" />
          </svg>
        </div>
      </div>

      <div className="h-px w-full bg-[var(--am-border)]" />

      <div className="flex w-full flex-col items-center justify-start gap-0.5 py-0.5 font-mono text-[10px] leading-tight select-none sm:text-[11px]">
        <pre className="m-0 font-mono text-[10px] text-[var(--am-text-muted)] sm:text-[11px]">     .       *       .    </pre>
        <pre className="m-0 font-mono text-[10px] text-[var(--am-text-muted)] sm:text-[11px]">  .     _|/_     .  </pre>
        <pre className="m-0 font-mono text-[10px] text-[var(--am-accent)] sm:text-[11px]">     -- ( STAR ) --   </pre>
        <pre className="m-0 font-mono text-[10px] text-[var(--am-text-muted)] sm:text-[11px]">  .     /_|_     .  </pre>
        <pre className="m-0 font-mono text-[10px] text-[var(--am-text-muted)] sm:text-[11px]">     .       *       .    </pre>
      </div>

      <div className="inline-flex w-full items-center justify-center pt-1.5 text-center sm:pt-2">
        <span className="font-mono text-[10px] font-normal text-[var(--am-accent)] sm:text-[11px]">
          [Error: Route not found. System remains online.]
        </span>
      </div>
    </div>
  );
}
