import type { Ref } from 'react';
import { fonts } from '../brand';
import { appStore } from '../state/store';
import './prize-button.css';

export const PRIZE_CLAIM_LABEL = 'You won all games? Get your free maple syrup';

export function PrizeButton({ onClick, inline = false, visuallyHidden = false, buttonRef, onFocusChange }: {
  onClick(): void;
  inline?: boolean;
  visuallyHidden?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
  onFocusChange?(focused: boolean): void;
}) {
  return <div className={visuallyHidden ? 'prize-button-accessible' : inline ? 'prize-button-inline' : 'prize-button-position'}>
    <style>{`@font-face{font-family:PrizeBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>
    <button ref={buttonRef} className="prize-claim-button" aria-haspopup="dialog"
      onFocus={() => onFocusChange?.(true)} onBlur={() => onFocusChange?.(false)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }} onKeyUp={e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
      onClick={() => { appStore.getState().markInput(performance.now()); onClick(); }}>{PRIZE_CLAIM_LABEL}</button>
  </div>;
}
