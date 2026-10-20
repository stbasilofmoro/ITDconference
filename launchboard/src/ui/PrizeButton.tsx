import { fonts } from '../brand';
import { appStore } from '../state/store';
import './prize-button.css';

export function PrizeButton({ onClick, inline = false }: { onClick(): void; inline?: boolean }) {
  return <div className={inline ? 'prize-button-inline' : 'prize-button-position'}>
    <style>{`@font-face{font-family:PrizeBarlow;src:url('${fonts.semibold}');font-weight:600}`}</style>
    <button className="prize-claim-button" aria-haspopup="dialog" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }} onKeyUp={e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }} onClick={() => { appStore.getState().markInput(performance.now()); onClick(); }}>You won all games? Get your free maple syrup</button>
  </div>;
}
